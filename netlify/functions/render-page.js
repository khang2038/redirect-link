const https = require('https');
const http = require('http');
const zlib = require('zlib');

exports.handler = async (event, context) => {
    const path = event.path;
    const url = new URL(event.rawUrl);
    const requestUrl = event.rawUrl;
    const ua = (event.headers && (event.headers['user-agent'] || event.headers['User-Agent'])) || '';
    
    // Parse URL để lấy target URL
    let targetUrl = 'https://google.com';
    
    if (path.startsWith('/posts/')) {
        let pathAfterPosts = path.substring(7); // Remove '/posts/'
        try {
            // Decode once if encoded; if not encoded, this will throw which we ignore
            pathAfterPosts = decodeURIComponent(pathAfterPosts);
        } catch (_) {}
        if (pathAfterPosts) {
            targetUrl = `https://todayonus.com/posts/${pathAfterPosts}`;
        }
    } else if (path === '/posts' || path === '/posts/') {
        targetUrl = 'https://google.com';
    }
    
    // Nếu không phải crawler -> redirect 302 tức thì (siêu nhanh)
    if (!isCrawler(ua)) {
        return {
            statusCode: 302,
            headers: {
                Location: targetUrl,
                'Cache-Control': 'no-store'
            },
            body: ''
        };
    }

    try {
        // Crawler: Fetch meta info từ target URL (có timeout mềm 7s)
        let metaInfo = await withTimeout(fetchMetaInfo(targetUrl), 7000).catch(() => null);

        // Fallback mạnh nếu site đích chặn bot/không có OG
        if (!metaInfo || (!metaInfo.title && !metaInfo.image)) {
            metaInfo = { title: '', description: '', image: '' };
        }

        // Nếu thiếu, thử thêm các biến thể URL dễ scrape hơn (AMP)
        if (!metaInfo.title || /^\s*loading\s*\.*$/i.test(metaInfo.title)) {
            const candidates = [
                targetUrl.endsWith('/') ? targetUrl + 'amp' : targetUrl + '/amp',
                targetUrl + '?amp',
                targetUrl + '/?amp',
            ];
            for (const alt of candidates) {
                try {
                    const altMeta = await fetchMetaInfo(alt);
                    if (altMeta && (altMeta.title || altMeta.image)) {
                        metaInfo = {
                            title: altMeta.title || metaInfo.title,
                            description: altMeta.description || metaInfo.description,
                            image: altMeta.image || metaInfo.image,
                        };
                        break;
                    }
                } catch (_) {}
            }
        }

        // Tạo title fallback từ slug nếu thiếu
        if (!metaInfo.title || /^\s*loading\s*\.*$/i.test(metaInfo.title)) {
            metaInfo.title = humanizeFromPath(targetUrl) || 'News';
        }
        // Tạo description fallback
        if (!metaInfo.description) {
            metaInfo.description = metaInfo.title;
        }
        // Ảnh fallback bằng dịch vụ screenshot (luôn khả dụng cho OG)
        if (!metaInfo.image) {
            const screenshot = `https://image.thum.io/get/width/1200/crop/630/noanimate/${encodeURIComponent(targetUrl)}`;
            metaInfo.image = screenshot;
        }

        // Generate HTML với meta tags (og:url giữ nguyên URL của site bạn)
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
            title: humanizeFromPath(targetUrl) || 'News',
            description: humanizeFromPath(targetUrl) || 'News',
            image: `https://image.thum.io/get/width/1200/crop/630/noanimate/${encodeURIComponent(targetUrl)}`
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
                    // Use a modern browser UA to avoid cloaking
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'close',
                    'Referer': 'https://www.google.com/',
                    'Cache-Control': 'no-cache'
                },
                timeout: 12000
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

                let stream = res;
                const encoding = (res.headers['content-encoding'] || '').toLowerCase();
                if (encoding.includes('gzip')) {
                    stream = res.pipe(zlib.createGunzip());
                } else if (encoding.includes('br') && zlib.createBrotliDecompress) {
                    stream = res.pipe(zlib.createBrotliDecompress());
                } else if (encoding.includes('deflate')) {
                    stream = res.pipe(zlib.createInflate());
                }

                let data = '';
                stream.on('data', chunk => data += chunk.toString('utf8'));
                stream.on('end', () => {
                    // Try to respect charset if provided
                    const ctype = (res.headers['content-type'] || '').toLowerCase();
                    // Basic handling; Netlify functions do not include iconv by default
                    // Most sites are utf-8; fallback as-is
                    resolve({ html: data, finalUrl: currentUrl, contentType: ctype });
                });
                stream.on('error', reject);
            });

            req.on('timeout', () => {
                req.destroy(new Error('Request timed out'));
            });
            req.on('error', reject);
            req.end();
        });
    }

    const { html, finalUrl } = await fetchWithRedirects(target);
    const meta = extractAllMeta(html);

    // Prefer OG tags, then Twitter, then title/description tags
    // Try JSON-LD as well
    const jsonLd = extractFromJsonLd(html);

    let title = meta['og:title'] || meta['twitter:title'] || jsonLd.headline || getTitle(html) || '';
    let description = meta['og:description'] || meta['twitter:description'] || jsonLd.description || meta['description'] || '';
    let image = meta['og:image'] || meta['og:image:url'] || meta['og:image:secure_url'] || meta['twitter:image'] || jsonLd.image || '';

    // Extra fallbacks: H1 and first IMG in content
    if (!title || /^\s*loading\s*\.*$/i.test(title)) {
        const h1 = getH1(html);
        if (h1) title = h1;
    }
    if (!image) {
        let firstImg = getFirstImage(html);
        if (firstImg) {
            try { firstImg = new URL(firstImg, finalUrl).toString(); } catch (_) {}
            image = firstImg;
        }
    }
    if (image && image.startsWith('//')) {
        image = 'https:' + image;
    }

    // Resolve relative image URLs
    if (image) {
        try { image = new URL(image, finalUrl).toString(); } catch (_) {}
    }

    return { title, description, image };
}

function extractAllMeta(html) {
    const metaMap = {};
    const metaTagRegex = /<meta\b[^>]*>/gi;
    let tag;
    while ((tag = metaTagRegex.exec(html)) !== null) {
        const attrs = tag[0];
        const nameMatch = attrs.match(/(?:name|property)\s*=\s*(["'])(.*?)\1/i) || attrs.match(/(?:name|property)\s*=\s*([^\s"'>]+)/i);
        const contentMatch = attrs.match(/content\s*=\s*(["'])([\s\S]*?)\1/i) || attrs.match(/content\s*=\s*([^\s"'>]+)/i);
        if (nameMatch && contentMatch) {
            const key = nameMatch[2] || nameMatch[1];
            const val = contentMatch[2] || contentMatch[1];
            if (key && typeof key === 'string') {
                metaMap[key.trim()] = (val || '').trim();
            }
        }
    }
    return metaMap;
}

function getTitle(html) {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? m[1].trim() : null;
}

function extractFromJsonLd(html) {
    try {
        const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
        for (const tag of scripts) {
            const jsonTextMatch = tag.match(/<script[^>]*>[\s\S]*?<\/script>/i);
            if (!jsonTextMatch) continue;
            const jsonText = tag.replace(/^[\s\S]*?<script[^>]*>/i, '').replace(/<\/script>[\s\S]*$/i, '');
            let obj;
            try {
                obj = JSON.parse(jsonText);
            } catch (_) {
                continue;
            }
            const candidate = Array.isArray(obj) ? obj.find(x => x && (x['@type'] === 'NewsArticle' || x['@type'] === 'Article' || x.headline)) : obj;
            if (candidate) {
                const headline = candidate.headline || candidate.name || '';
                let image = '';
                if (candidate.image) {
                    if (typeof candidate.image === 'string') image = candidate.image;
                    else if (Array.isArray(candidate.image)) image = candidate.image[0] || '';
                    else if (candidate.image.url) image = candidate.image.url;
                }
                const description = candidate.description || '';
                return { headline, image, description };
            }
        }
    } catch (_) {}
    return { headline: '', image: '', description: '' };
}

function humanizeFromPath(urlStr) {
    try {
        const u = new URL(urlStr);
        const path = u.pathname || '';
        const slug = path.split('/').filter(Boolean).pop() || '';
        if (!slug) return '';
        return slug
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, c => c.toUpperCase());
    } catch (_) {
        return '';
    }
}

function getH1(html) {
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!m) return null;
    return m[1].replace(/<[^>]*>/g, '').trim();
}

function getFirstImage(html) {
    // Prefer featured image like wp-post-image; fallback to first <img>
    let m = html.match(/<img[^>]+class=["'][^"']*(?:wp-image|wp-post-image|featured|thumbnail)[^"']*["'][^>]*>/i) ||
            html.match(/<img[^>]*>/i);
    if (!m) return null;
    const tag = m[0];
    const srcMatch = tag.match(/\s(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i);
    return srcMatch ? srcMatch[1] : null;
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

function isCrawler(userAgent) {
    const ua = (userAgent || '').toLowerCase();
    return ua.includes('facebookexternalhit') ||
           ua.includes('facebookcatalog') ||
           ua.includes('whatsapp') ||
           ua.includes('twitterbot') ||
           ua.includes('linkedinbot') ||
           ua.includes('slackbot') ||
           ua.includes('telegrambot') ||
           ua.includes('discordbot');
}

function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => resolve(null), ms);
        promise.then(v => { clearTimeout(t); resolve(v); })
               .catch(e => { clearTimeout(t); reject(e); });
    });
}
