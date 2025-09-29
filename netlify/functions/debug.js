const https = require('https');
const http = require('http');
const zlib = require('zlib');

exports.handler = async (event, context) => {
    const path = event.path;
    console.log('Debug - Path:', path);
    
    let targetUrl = 'https://google.com';
    
    if (path.startsWith('/posts/')) {
        const pathAfterPosts = path.substring(7);
        if (pathAfterPosts) {
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        }
    }
    
    console.log('Debug - Target URL:', targetUrl);
    
    // Test fetch meta info
    try {
        const metaInfo = await fetchMetaInfo(targetUrl);
        console.log('Debug - Meta info:', metaInfo);
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta property="og:title" content="${metaInfo.title}">
    <meta property="og:description" content="${metaInfo.description}">
    <meta property="og:image" content="${metaInfo.image}">
    <meta property="og:url" content="${targetUrl}">
    <title>${metaInfo.title}</title>
</head>
<body>
    <h1>Debug Info</h1>
    <p>Target URL: ${targetUrl}</p>
    <p>Title: ${metaInfo.title}</p>
    <p>Description: ${metaInfo.description}</p>
    <p>Image: ${metaInfo.image}</p>
    <script>window.location.href = '${targetUrl}';</script>
</body>
</html>`;
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };
    } catch (error) {
        console.error('Debug - Error:', error);
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Debug Error</title>
</head>
<body>
    <h1>Debug Error</h1>
    <p>Target URL: ${targetUrl}</p>
    <p>Error: ${error.message}</p>
    <script>window.location.href = '${targetUrl}';</script>
</body>
</html>`;
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };
    }
};

function fetchMetaInfo(url) {
    return new Promise((resolve, reject) => {
        console.log('Debug - Fetching from:', url);
        
        const client = url.startsWith('https') ? https : http;
        
        const request = client.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        }, (res) => {
            console.log('Debug - Response status:', res.statusCode);
            console.log('Debug - Response headers:', res.headers);
            
            let data = '';
            let stream = res;
            
            if (res.headers['content-encoding'] === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (res.headers['content-encoding'] === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            } else if (res.headers['content-encoding'] === 'br') {
                stream = res.pipe(zlib.createBrotliDecompress());
            }
            
            stream.on('data', (chunk) => {
                data += chunk;
            });
            
            stream.on('end', () => {
                console.log('Debug - Data length:', data.length);
                console.log('Debug - First 500 chars:', data.substring(0, 500));
                
                const title = extractMeta(data, 'og:title') || 
                             extractMeta(data, 'title') || 
                             'No title found';
                             
                const description = extractMeta(data, 'og:description') || 
                                  extractMeta(data, 'description') || 
                                  'No description found';
                                  
                const image = extractMeta(data, 'og:image') || 
                             extractMeta(data, 'twitter:image') || 
                             'No image found';
                
                console.log('Debug - Extracted:', { title, description, image });
                resolve({ title, description, image });
            });
            
            stream.on('error', (error) => {
                console.error('Debug - Stream error:', error);
                reject(error);
            });
        });
        
        request.on('error', (error) => {
            console.error('Debug - Request error:', error);
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            console.log('Debug - Timeout');
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

function extractMeta(html, property) {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}
