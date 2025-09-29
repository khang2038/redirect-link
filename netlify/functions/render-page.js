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
    
    // Generate HTML với meta tags cố định trước
    const fallbackHtml = generateHTML({
        title: 'SAD NEWS: Just 15 minutes ago, Bruce Willis family broke down in tears',
        description: 'Known for his iconic roles in Die Hard, Pulp Fiction, The Sixth Sense, and countless other films',
        image: 'https://todayonus.com/wp-content/uploads/2025/01/bruce-willis-news.jpg'
    }, targetUrl);
    
    try {
        // Fetch meta info từ target URL
        const metaInfo = await fetchMetaInfo(targetUrl);
        console.log('Meta info fetched:', metaInfo);
        
        // Generate HTML với meta tags thực tế
        const html = generateHTML(metaInfo, targetUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=300'
            },
            body: html
        };
    } catch (error) {
        console.error('Error fetching meta info:', error);
        
        // Fallback HTML với thông tin cố định
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body: fallbackHtml
        };
    }
};

function fetchMetaInfo(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, (res) => {
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
                                      'Loading content...';
                                      
                    const image = extractMeta(data, 'og:image') || 
                                 extractMeta(data, 'twitter:image') || 
                                 '';
                    
                    resolve({ title, description, image });
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function extractMeta(html, property) {
    const metaTagRegex = /<meta\b[^>]*>/gi;
    let match;
    while ((match = metaTagRegex.exec(html)) !== null) {
        const tag = match[0];
        const hasProp = new RegExp(`(?:property|name)=["']${property}["']`, 'i').test(tag);
        if (!hasProp) continue;
        const contentMatch = tag.match(/content=["']([^"']*)["']/i);
        if (contentMatch) {
            return contentMatch[1];
        }
    }
    return null;
}

function generateHTML(metaInfo, targetUrl) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Meta tags cho Facebook Open Graph -->
    <meta property="og:title" content="${metaInfo.title}">
    <meta property="og:description" content="${metaInfo.description}">
    <meta property="og:image" content="${metaInfo.image}">
    <meta property="og:url" content="${targetUrl}">
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
