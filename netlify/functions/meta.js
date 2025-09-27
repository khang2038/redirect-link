const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const { path } = event.queryStringParameters || {};
    
    if (!path) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Path parameter required' })
        };
    }
    
    try {
        // Tạo URL đích
        let targetUrl;
        if (path === 'posts' || path === 'posts/') {
            targetUrl = 'https://google.com';
        } else if (path.startsWith('posts/')) {
            const pathAfterPosts = path.replace('posts/', '');
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        } else {
            targetUrl = 'https://google.com';
        }
        
        // Fetch meta info từ URL đích
        let metaInfo = {
            title: 'Loading...',
            description: 'Đang tải nội dung...',
            image: ''
        };
        
        if (targetUrl !== 'https://google.com') {
            try {
                const response = await fetch(targetUrl);
                const html = await response.text();
                
                // Parse HTML để lấy meta tags
                const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"|<title>([^<]*)<\/title>/);
                const descMatch = html.match(/<meta property="og:description" content="([^"]*)"|<meta name="description" content="([^"]*)"/);
                const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"|<meta name="twitter:image" content="([^"]*)"/);
                
                metaInfo.title = titleMatch ? (titleMatch[1] || titleMatch[2] || 'Loading...') : 'Loading...';
                metaInfo.description = descMatch ? (descMatch[1] || descMatch[2] || 'Đang tải nội dung...') : 'Đang tải nội dung...';
                metaInfo.image = imageMatch ? (imageMatch[1] || imageMatch[2] || '') : '';
            } catch (error) {
                console.error('Error fetching meta info:', error);
            }
        }
        
        // Trả về HTML với meta tags
        const html = `
<!DOCTYPE html>
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
        // Redirect logic
        function getRedirectUrl() {
            const currentUrl = window.location.href;
            const url = new URL(currentUrl);
            const pathname = url.pathname;
            
            if (pathname === '/posts' || pathname === '/posts/') {
                return 'https://google.com';
            }
            
            const postsMatch = pathname.match(/^\/posts\/(.+)$/);
            if (postsMatch) {
                const pathAfterPosts = postsMatch[1];
                return \`https://todayonus.com/posts/\${pathAfterPosts}\`;
            }
            
            return 'https://google.com';
        }
        
        // Redirect ngay lập tức
        const TARGET_URL = getRedirectUrl();
        window.location.href = TARGET_URL;
    </script>
</body>
</html>`;
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: html
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
