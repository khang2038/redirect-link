export default async (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Kiểm tra nếu pathname kết thúc bằng '/posts' hoặc '/posts/'
  if (pathname === '/posts' || pathname === '/posts/') {
    return Response.redirect('https://google.com', 302);
  }

  // Kiểm tra nếu có '/posts/' trong pathname
  const postsMatch = pathname.match(/^\/posts\/(.+)$/);
  
  if (!postsMatch) {
    return Response.redirect('https://google.com', 302);
  }

  const pathAfterPosts = postsMatch[1];
  const targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;

  // Fetch thông tin từ URL đích
  let title = 'Loading...';
  let description = 'Đang tải nội dung...';
  let image = '';

  try {
    const response = await fetch(targetUrl);
    const html = await response.text();

    // Extract meta tags
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);

    if (titleMatch) title = titleMatch[1];
    if (descMatch) description = descMatch[1];
    if (imageMatch) image = imageMatch[1];

    // Fallback to title tag if og:title not found
    if (title === 'Loading...') {
      const titleTagMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleTagMatch) title = titleTagMatch[1];
    }
  } catch (error) {
    console.error('Error fetching target URL:', error);
  }

  // HTML với meta tags động
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Meta tags cho Facebook Open Graph -->
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${request.url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="TodayOnUs">
    
    <!-- Meta tags cho Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="${image}">
    
    <!-- Meta tags cơ bản -->
    <title>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    <meta name="description" content="${description.replace(/"/g, '&quot;')}">
    
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
        window.location.href = '${targetUrl}';
    </script>
</body>
</html>`;

  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
