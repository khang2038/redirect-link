const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const path = event.path;
    console.log('Path:', path);
    
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
    
    console.log('Target URL:', targetUrl);
    
    try {
        // Fetch meta info từ target URL
        const metaInfo = await fetchMetaInfo(targetUrl);
        console.log('Meta info fetched:', metaInfo);
        
        // Generate HTML với meta tags
        const html = generateHTML(metaInfo, targetUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300'
            },
            body: html
        };
    } catch (error) {
        console.error('Error:', error);
        
        // Fallback HTML
        const fallbackHtml = generateHTML({
            title: 'Loading...',
            description: 'Please wait...',
            image: ''
        }, targetUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            },
            body: fallbackHtml
        };
    }
};

function fetchMetaInfo(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const request = client.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const title = extractMeta(data, 'og:title') || 
                                 extractMeta(data, 'title') || 
                                 'Loading...';
                                 
                    const description = extractMeta(data, 'og:description') || 
                                      extractMeta(data, 'description') || 
                                      'Please wait...';
                                      
                    const image = extractMeta(data, 'og:image') || 
                                 extractMeta(data, 'twitter:image') || 
                                 '';
                    
                    resolve({ title, description, image });
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

function extractMeta(html, property) {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}

function generateHTML(metaInfo, targetUrl) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Meta tags cho Facebook Open Graph -->
    <meta property="og:title" content="${escapeHtml(metaInfo.title)}">
    <meta property="og:description" content="${escapeHtml(metaInfo.description)}">
    <meta property="og:image" content="${escapeHtml(metaInfo.image)}">
    <meta property="og:url" content="${escapeHtml(targetUrl)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="TodayOnUs">
    
    <!-- Meta tags cho Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(metaInfo.title)}">
    <meta name="twitter:description" content="${escapeHtml(metaInfo.description)}">
    <meta name="twitter:image" content="${escapeHtml(metaInfo.image)}">
    
    <!-- Meta tags cơ bản -->
    <title>${escapeHtml(metaInfo.title)}</title>
    <meta name="description" content="${escapeHtml(metaInfo.description)}">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: white;
        }
    </style>
</head>
<body>
    <script>
        // Redirect ngay lập tức
        window.location.href = '${escapeHtml(targetUrl)}';
    </script>
</body>
</html>`;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
