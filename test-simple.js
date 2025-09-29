// Test function đơn giản
exports.handler = async (event, context) => {
    const path = event.path;
    console.log('Path:', path);
    
    let targetUrl = 'https://google.com';
    
    if (path.startsWith('/posts/')) {
        const pathAfterPosts = path.substring(7);
        if (pathAfterPosts) {
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        }
    }
    
    // Tạo title từ URL path
    const urlPath = targetUrl.replace('https://todayonus.com/posts/', '');
    const words = urlPath.split('-').slice(0, 5);
    const title = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const metaInfo = {
        title: title || 'Breaking News',
        description: 'Latest news and updates from TodayOnUs',
        image: 'https://todayonus.com/wp-content/uploads/2025/01/default-news.jpg'
    };
    
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <meta property="og:title" content="${metaInfo.title}">
    <meta property="og:description" content="${metaInfo.description}">
    <meta property="og:image" content="${metaInfo.image}">
    <meta property="og:url" content="${targetUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="TodayOnUs">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${metaInfo.title}">
    <meta name="twitter:description" content="${metaInfo.description}">
    <meta name="twitter:image" content="${metaInfo.image}">
    
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
        window.location.href = '${targetUrl}';
    </script>
</body>
</html>`;
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        },
        body: html
    };
};
