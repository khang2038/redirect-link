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
    
    // Tạo fallback meta info dựa trên URL
    const fallbackMeta = generateFallbackMeta(targetUrl);
    
    try {
        // Fetch meta info từ target URL với timeout dài hơn
        const metaInfo = await Promise.race([
            fetchMetaInfo(targetUrl),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 8000)
            )
        ]);
        console.log('Meta info fetched successfully:', metaInfo);
        
        // Generate HTML với meta tags thực tế
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
        console.error('Error fetching meta info, using fallback:', error);
        
        // Sử dụng fallback meta info
        const html = generateHTML(fallbackMeta, targetUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=60'
            },
            body: html
        };
    }
};

function fetchMetaInfo(url) {
    return new Promise((resolve, reject) => {
        console.log('Fetching meta info from:', url);
        
        const client = url.startsWith('https') ? https : http;
        
        const request = client.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        }, (res) => {
            console.log('Response status:', res.statusCode);
            console.log('Response headers:', res.headers);
            
            let data = '';
            let dataLength = 0;
            const maxLength = 200000; // Tăng lên 200KB
            
            res.on('data', (chunk) => {
                dataLength += chunk.length;
                if (dataLength < maxLength) {
                    data += chunk;
                }
            });
            
            res.on('end', () => {
                try {
                    console.log('Data length received:', data.length);
                    
                    const title = extractMeta(data, 'og:title') || 
                                 extractMeta(data, 'title') || 
                                 'Loading...';
                                 
                    const description = extractMeta(data, 'og:description') || 
                                      extractMeta(data, 'description') || 
                                      'Please wait...';
                                      
                    const image = extractMeta(data, 'og:image') || 
                                 extractMeta(data, 'twitter:image') || 
                                 '';
                    
                    console.log('Extracted meta:', { title, description, image });
                    resolve({ title, description, image });
                } catch (error) {
                    console.error('Error parsing meta data:', error);
                    reject(error);
                }
            });
        });
        
        request.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
        request.setTimeout(3000, () => {
            console.log('Request timeout');
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

function generateFallbackMeta(targetUrl) {
    if (targetUrl === 'https://google.com') {
        return {
            title: 'Redirect to Google',
            description: 'You are being redirected to Google',
            image: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'
        };
    }
    
    // Tạo meta info dựa trên URL path
    const urlPath = targetUrl.replace('https://todayonus.com/posts/', '');
    const words = urlPath.split('-').slice(0, 5); // Lấy 5 từ đầu
    const title = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return {
        title: title || 'Breaking News',
        description: 'Latest news and updates from TodayOnUs',
        image: 'https://todayonus.com/wp-content/uploads/2025/01/default-news.jpg'
    };
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
