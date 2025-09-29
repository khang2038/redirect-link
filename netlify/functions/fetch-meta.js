const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    const { url } = event.queryStringParameters || {};
    
    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'URL parameter is required' })
        };
    }
    
    try {
        const metaInfo = await fetchMetaInfo(url);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(metaInfo)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
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
                    let title = extractMeta(data, 'og:title');
                    if (!title) {
                        title = extractFirstTagText(data, 'title') || 'Loading...';
                    }
                                 
                    const description = extractMeta(data, 'og:description') || 
                                      extractMeta(data, 'description') || 
                                      'Loading content...';
                                      
                    const image = extractMeta(data, 'og:image') || 
                                 extractMeta(data, 'og:image:secure_url') ||
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

function extractFirstTagText(html, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\s\S]*?)<\/${tagName}>`, 'i');
    const match = html.match(regex);
    if (!match) return '';
    return match[1].replace(/<[^>]*>/g, '').trim();
}
