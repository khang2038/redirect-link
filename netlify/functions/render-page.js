const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    const path = event.path || '/';
    const requestUrl = event.headers['x-forwarded-proto'] + '://' + event.headers.host + event.path;
    
    // Xác định target URL
    let targetUrl = 'https://google.com';
    if (path.startsWith('/posts/')) {
        const pathAfterPosts = path.substring(7); // Loại bỏ '/posts/'
        if (pathAfterPosts) {
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        }
    } else if (path === '/posts' || path === '/posts/') {
        targetUrl = 'https://google.com';
    }

    try {
        // Fetch meta info từ target URL
        const metaInfo = await fetchMetaInfo(targetUrl);
        
        // Generate HTML với meta tags, sử dụng requestUrl cho og:url
        const html = generateHTML(metaInfo, targetUrl, requestUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=300'
            },
            body: html
        };
    } catch (error) {
        console.error('Error in handler:', error);
        // Fallback HTML
        const fallbackHtml = generateHTML(
            {
                title: 'Loading...',
                description: 'Please wait while we load the content...',
                image: ''
            },
            targetUrl,
            requestUrl
        );
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body: fallbackHtml
        };
    }
};

async function fetchMetaInfo(target) {
    const maxRedirects = 5;

    async function fetchWithRedirects(currentUrl, redirectCount = 0, useBrowserUA = false) {
        return new Promise((resolve, reject) => {
            const isHttps = currentUrl.startsWith('https');
            const client = isHttps ? https : http;

            const req = client.request(currentUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': useBrowserUA
                        ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
                        : 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'identity',
                    'Connection': 'close'
                },
                timeout: 10000
            }, (res) => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                    if (redirectCount >= maxRedirects) {
                        reject(new Error('Too many redirects'));
                        return;
                    }
                    const nextUrl = new URL(res.headers.location, currentUrl).toString();
                    res.resume();
                    resolve(fetchWithRedirects(nextUrl, redirectCount + 1, useBrowserUA));
                    return;
                }

                let data = '';
                res.on('data', chunk => { data += chunk.toString('utf8'); });
                res.on('end', () => resolve({ html: data, finalUrl: currentUrl }));
                res.on('error', reject);
            });

            req.on('timeout', () => {
                req.destroy(new Error('Request timed out'));
            });
            req.on('error', reject);
            req.end();
        });
    }

    // Thử fetch với Facebook UA trước
    let { html, finalUrl } = await fetchWithRedirects(target, 0, false);

    // Thử AMP link nếu có
    let ampUrl = extractAmpLink(html);
    if (ampUrl) {
        try {
            const ampResolved = new URL(ampUrl, finalUrl).toString();
            const ampResp = await fetchWithRedirects(ampResolved, 0, false);
            html = ampResp.html;
            finalUrl = ampResp.finalUrl;
        } catch (_) {}
    }

    let title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || getTitle(html) || 'Loading...';
    let description = extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || extractMeta(html, 'description') || 'Please wait while we load the content...';
    let image = extractMeta(html, 'og:image') || extractMeta(html, 'og:image:secure_url') || extractMeta(html, 'og:image:url') || extractMeta(html, 'twitter:image') || extractMeta(html, 'twitter:image:src') || '';

    // Nếu không lấy được title, thử lại với browser-like UA
    if (!title || title === 'Loading...') {
        try {
            const retry = await fetchWithRedirects(target, 0, true);
            html = retry.html;
            finalUrl = retry.finalUrl;
            title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || getTitle(html) || 'Loading...';
            description = description || extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || extractMeta(html, 'description') || 'Please wait while we load the content...';
            image = image || extractMeta(html, 'og:image') || extractMeta(html, 'og:image:secure_url') || extractMeta(html, 'og:image:url') || extractMeta(html, 'twitter:image') || extractMeta(html, 'twitter:image:src') || '';
        } catch (_) {}
    }

    // Resolve relative image URL
    if (image) {
        try {
            image = new URL(image, finalUrl).toString();
        } catch (_) {}
    }

    return { title, description, image };
}

function extractMeta(html, property) {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}

function getTitle(html) {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? match[1].trim() : null;
}

function extractAmpLink(html) {
    const match = html.match(/<link[^>]+rel=["']amphtml["'][^>]*href=["']([^"']+)["']/i);
    return match ? match[1] : null;
}

function generateHTML(metaInfo, targetUrl, requestUrl) {
    // Escape HTML để tránh XSS
    const escapeHTML = (str) => str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Meta tags cho Facebook Open Graph -->
    <meta property="og:title" content="${escapeHTML(metaInfo.title)}">
    <meta property="og:description" content="${escapeHTML(metaInfo.description)}">
    <meta property="og:image" content="${escapeHTML(metaInfo.image)}">
    <meta property="og:url" content="${escapeHTML(requestUrl)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="TodayOnUs">
    
    <!-- Meta tags cho Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHTML(metaInfo.title)}">
    <meta name="twitter:description" content="${escapeHTML(metaInfo.description)}">
    <meta name="twitter:image" content="${escapeHTML(metaInfo.image)}">
    
    <!-- Meta tags cơ bản -->
    <title>${escapeHTML(metaInfo.title)}</title>
    <meta name="description" content="${escapeHTML(metaInfo.description)}">
    
    <!-- Meta refresh -->
    <meta http-equiv="refresh" content="3;url=${escapeHTML(targetUrl)}">
    
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        img {
            max-width: 100%;
            height: auto;
            margin: 20px 0;
        }
        .link {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007cba;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .link:hover {
            background-color: #005a87;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapeHTML(metaInfo.title)}</h1>
        <p>${escapeHTML(metaInfo.description)}</p>
        ${metaInfo.image ? `<img src="${escapeHTML(metaInfo.image)}" alt="${escapeHTML(metaInfo.title)}">` : ''}
        <p>You will be redirected to the full article in 3 seconds...</p>
        <a href="${escapeHTML(targetUrl)}" class="link">Continue to article</a>
    </div>
    
    <script>
        // Redirect ngay lập tức cho user thường
        if (!navigator.userAgent.toLowerCase().includes('facebookexternalhit') && 
            !navigator.userAgent.toLowerCase().includes('facebookcatalog') &&
            !navigator.userAgent.toLowerCase().includes('whatsapp') &&
            !navigator.userAgent.toLowerCase().includes('twitterbot') &&
            !navigator.userAgent.toLowerCase().includes('linkedinbot')) {
            window.location.href = '${escapeHTML(targetUrl)}';
        }
    </script>
</body>
</html>`;
}