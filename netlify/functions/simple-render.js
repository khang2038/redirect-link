const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Lấy path từ query parameter hoặc từ URL path
    let path = event.queryStringParameters?.path || event.path || '/';
    const requestUrl = event.headers['x-forwarded-proto'] + '://' + event.headers.host + path;
    
    console.log('Path:', path);
    console.log('Request URL:', requestUrl);
    
    // Xác định target URL
    let targetUrl = 'https://google.com';
    if (path.startsWith('/posts/')) {
        const pathAfterPosts = path.substring(7);
        if (pathAfterPosts) {
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        }
    } else if (path === '/posts' || path === '/posts/') {
        targetUrl = 'https://google.com';
    }
    
    console.log('Target URL:', targetUrl);
    
    try {
        // Fetch meta info với timeout ngắn
        const metaInfo = await fetchMetaInfoSimple(targetUrl);
        console.log('Meta info:', metaInfo);
        
        const html = generateSimpleHTML(metaInfo, targetUrl, requestUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=60'
            },
            body: html
        };
    } catch (error) {
        console.error('Error:', error);
        
        const fallbackHtml = generateSimpleHTML({
            title: 'Loading...',
            description: 'Please wait while we load the content...',
            image: ''
        }, targetUrl, requestUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            },
            body: fallbackHtml
        };
    }
};

function fetchMetaInfoSimple(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const timeout = 5000; // 5 seconds timeout
        
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FacebookBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity'
            },
            timeout: timeout
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk.toString('utf8');
            });
            
            res.on('end', () => {
                try {
                    const title = extractMeta(data, 'og:title') || 
                                 extractMeta(data, 'twitter:title') || 
                                 getTitle(data) || 
                                 'Loading...';
                                 
                    const description = extractMeta(data, 'og:description') || 
                                      extractMeta(data, 'twitter:description') || 
                                      extractMeta(data, 'description') || 
                                      'Please wait while we load the content...';
                                      
                    const image = extractMeta(data, 'og:image') || 
                                 extractMeta(data, 'twitter:image') || 
                                 '';
                    
                    resolve({ title, description, image });
                } catch (error) {
                    reject(error);
                }
            });
            
            res.on('error', (error) => {
                reject(error);
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.on('error', (error) => {
            reject(error);
        });
    });
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

function generateSimpleHTML(metaInfo, targetUrl, requestUrl) {
    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    };

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
    <meta http-equiv="refresh" content="2;url=${escapeHTML(targetUrl)}">
    
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
        <p>You will be redirected to the full article in 2 seconds...</p>
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
