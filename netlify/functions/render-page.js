const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    const path = event.path;
    const url = new URL(event.rawUrl);
    const requestUrl = event.rawUrl;
    
    // Parse URL để lấy target URL
    let targetUrl = 'https://google.com';
    
    if (path.startsWith('/posts/')) {
        const pathAfterPosts = path.substring(7); // Remove '/posts/'
        if (pathAfterPosts) {
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        }
    } else if (path === '/posts' || path === '/posts/') {
        targetUrl = 'https://google.com';
    }
    
    try {
        // Fetch meta info từ target URL (theo dõi redirect, bỏ nén, UA thực tế)
        const metaInfo = await fetchMetaInfo(targetUrl);
        
        // Generate HTML với meta tags (og:url là URL hiện tại của bạn)
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
        // Fallback HTML
        const fallbackHtml = generateHTML({
            title: 'Loading...',
            description: 'Please wait while we load the content...',
            image: ''
        }, targetUrl, requestUrl);
        
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

    async function fetchWithRedirects(currentUrl, redirectCount = 0) {
        return new Promise((resolve, reject) => {
            const isHttps = currentUrl.startsWith('https');
            const client = isHttps ? https : http;

            const req = client.request(currentUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'identity',
                    'Connection': 'close'
                },
                timeout: 10000
            }, (res) => {
                // Handle redirects
                if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                    if (redirectCount >= maxRedirects) {
                        reject(new Error('Too many redirects'));
                        return;
                    }
                    const nextUrl = new URL(res.headers.location, currentUrl).toString();
                    res.resume();
                    resolve(fetchWithRedirects(nextUrl, redirectCount + 1));
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

    const { html, finalUrl } = await fetchWithRedirects(target);
    const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || getTitle(html) || 'Loading...';
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || extractMeta(html, 'description') || '';
    let image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || '';
    // Resolve relative image URL
    if (image) {
        try { image = new URL(image, finalUrl).toString(); } catch (_) {}
    }
    return { title, description, image };
}

function extractMeta(html, property) {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}

function getTitle(html) {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? m[1].trim() : null;
}

function generateHTML(metaInfo, targetUrl, requestUrl) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Meta tags cho Facebook Open Graph -->
    <meta property="og:title" content="${metaInfo.title}">
    <meta property="og:description" content="${metaInfo.description}">
    <meta property="og:image" content="${metaInfo.image}">
    <meta property="og:url" content="${requestUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="TodayOnUs">
    
    <!-- Meta tags cho Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${metaInfo.title}">
    <meta name="twitter:description" content="${metaInfo.description}">
    <meta name="twitter:image" content="${metaInfo.image}">
    
    <!-- Meta tags cơ bản -->
    <title>${metaInfo.title}</title>
    <meta name="description" content="${metaInfo.description}">
    
    <!-- Meta refresh -->
    <meta http-equiv="refresh" content="3;url=${targetUrl}">
    
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
        <h1>${metaInfo.title}</h1>
        <p>${metaInfo.description}</p>
        ${metaInfo.image ? `<img src="${metaInfo.image}" alt="${metaInfo.title}">` : ''}
        <p>You will be redirected to the full article in 3 seconds...</p>
        <a href="${targetUrl}" class="link">Continue to article</a>
    </div>
    
    <script>
        // Redirect ngay lập tức cho user thường
        if (!navigator.userAgent.toLowerCase().includes('facebookexternalhit') && 
            !navigator.userAgent.toLowerCase().includes('facebookcatalog') &&
            !navigator.userAgent.toLowerCase().includes('whatsapp') &&
            !navigator.userAgent.toLowerCase().includes('twitterbot') &&
            !navigator.userAgent.toLowerCase().includes('linkedinbot')) {
            window.location.href = '${targetUrl}';
        }
    </script>
</body>
</html>`;
}
