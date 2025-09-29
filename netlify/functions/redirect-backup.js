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
    
    // Luôn fetch meta info từ target URL
    let metaInfo;
    
    if (targetUrl === 'https://google.com') {
        metaInfo = {
            title: 'Redirect to Google',
            description: 'You are being redirected to Google',
            image: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'
        };
    } else {
        try {
            console.log('Attempting to fetch meta info from:', targetUrl);
            metaInfo = await fetchMetaInfo(targetUrl);
            // Hoàn thiện giá trị rỗng bằng title tag nếu cần
            if (!metaInfo.title) {
                metaInfo.title = extractFirstTagText(metaInfo.html || '', 'title');
            }
            // Chuẩn hóa image thành absolute URL
            metaInfo.image = resolveImageUrl(metaInfo.image, targetUrl);
            // Xóa html khỏi response trước khi render
            delete metaInfo.html;
            console.log('Meta info fetched successfully:', metaInfo);
        } catch (error) {
            console.error('Error fetching meta info:', error);
            // Fallback nếu fetch lỗi
            metaInfo = generateFallbackMeta(targetUrl);
        }
    }
    
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
};

function fetchMetaInfo(url) {
    return new Promise((resolve, reject) => {
        console.log('Fetching meta info from:', url);
        
        // 1) Thử fetch trực tiếp bằng UA của Facebook crawler (nhiều site trả OG đúng theo UA này)
        const client = https;
        const directReq = client.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext/)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }
        }, (res) => {
            console.log('Direct fetch status:', res.statusCode);
            let data = '';
            let dataLength = 0;
            const maxLength = 1000000;
            res.on('data', (chunk) => {
                dataLength += chunk.length;
                if (dataLength < maxLength) data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && data) {
                    try {
                        let title = extractMeta(data, 'og:title');
                        if (!title) title = extractFirstTagText(data, 'title') || 'Loading...';
                        const description = extractMeta(data, 'og:description') || extractMeta(data, 'description') || 'Please wait...';
                        let image = extractMeta(data, 'og:image') || extractMeta(data, 'og:image:secure_url') || extractMeta(data, 'twitter:image') || '';
                        console.log('Extracted meta from direct fetch:', { title, description, image });
                        resolve({ title, description, image, html: data });
                        return;
                    } catch (e) {
                        console.error('Direct parse error, falling back to proxy:', e);
                        fallbackToProxy();
                    }
                } else {
                    console.log('Direct fetch not OK, falling back to proxy');
                    fallbackToProxy();
                }
            });
            res.on('error', (err) => {
                console.error('Direct fetch response error:', err);
                fallbackToProxy();
            });
        });
        directReq.on('error', (err) => {
            console.error('Direct fetch request error:', err);
            fallbackToProxy();
        });
        directReq.setTimeout(8000, () => {
            console.log('Direct fetch timeout');
            directReq.destroy();
            fallbackToProxy();
        });

        // 2) Fallback sang proxy allorigins (ổn định, không cần đăng ký)
        function fallbackToProxy() {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            console.log('Trying proxy (allorigins):', proxyUrl);
            const req = https.get(proxyUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive'
                }
            }, (res) => {
                console.log('Proxy response status:', res.statusCode);
                let data = '';
                let dataLength = 0;
                const maxLength = 1000000;
                res.on('data', (chunk) => {
                    dataLength += chunk.length;
                    if (dataLength < maxLength) data += chunk;
                });
                res.on('end', () => {
                    try {
                        let title = extractMeta(data, 'og:title');
                        if (!title) title = extractFirstTagText(data, 'title') || 'Loading...';
                        const description = extractMeta(data, 'og:description') || extractMeta(data, 'description') || 'Please wait...';
                        let image = extractMeta(data, 'og:image') || extractMeta(data, 'og:image:secure_url') || extractMeta(data, 'twitter:image') || '';
                        console.log('Extracted meta from proxy:', { title, description, image });
                        resolve({ title, description, image, html: data });
                    } catch (e) {
                        reject(e);
                    }
                });
                res.on('error', (err) => {
                    reject(err);
                });
            });
            req.on('error', (err) => reject(err));
            req.setTimeout(8000, () => {
                console.log('Proxy request timeout');
                req.destroy();
                reject(new Error('Proxy request timeout'));
            });
        }
    });
}

function extractMeta(html, property) {
    // Khớp thẻ meta bất kỳ, sau đó đọc thuộc tính để không phụ thuộc thứ tự
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

function extractFirstTagText(html, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\s\S]*?)<\/${tagName}>`, 'i');
    const match = html.match(regex);
    if (!match) return '';
    return match[1].replace(/<[^>]*>/g, '').trim();
}

function resolveImageUrl(imageUrl, targetUrl) {
    if (!imageUrl) return '';
    try {
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('//')) {
            return 'https:' + imageUrl;
        }
        const u = new URL(targetUrl);
        if (imageUrl.startsWith('/')) {
            return u.origin + imageUrl;
        }
        const dir = u.pathname.endsWith('/') ? u.pathname : u.pathname.substring(0, u.pathname.lastIndexOf('/') + 1);
        return u.origin + dir + imageUrl;
    } catch (_) {
        return imageUrl;
    }
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

