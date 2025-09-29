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
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}
