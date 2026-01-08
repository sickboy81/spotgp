/**
 * Saphira R2 Signer - Cloudflare Worker
 * Cole este código inteiro no editor do Worker
 */

export default {
    async fetch(request, env) {
        // CORS Headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle OPTIONS (preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Health check
        if (request.method === 'GET') {
            return new Response('Saphira Signer is running', {
                headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
            });
        }

        // Sign endpoint
        if (request.method === 'POST') {
            try {
                const body = await request.json();
                const { fileName, contentType } = body;

                if (!fileName) {
                    return new Response(JSON.stringify({ error: 'Missing fileName' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // Generate unique key
                const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                // Generate signed URL for PUT (5 minutes expiry)
                // R2 binding automatically handles signing
                const signedUrl = await env.R2_BUCKET.createMultipartUpload(key);

                // Actually, for simple PUT we use a different approach:
                // We'll write directly from the signed URL or use presigned URLs

                // Since R2 bindings don't have native presigned URL generation,
                // we'll use the S3-compatible API with AWS4 signing
                // BUT - there's an easier way: use r2.put directly from Worker

                // Alternative approach: Return upload endpoint, Worker proxies the upload
                // This is simpler and works reliably

                return new Response(JSON.stringify({
                    uploadUrl: `${new URL(request.url).origin}/upload/${key}`,
                    key: key,
                    publicUrl: `https://pub-e08d5483eda74754bfd9478e2c0a4522.r2.dev/${key}`
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Upload proxy endpoint
        if (request.method === 'PUT' && new URL(request.url).pathname.startsWith('/upload/')) {
            try {
                const key = new URL(request.url).pathname.replace('/upload/', '');
                const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

                // Upload directly to R2
                await env.R2_BUCKET.put(key, request.body, {
                    httpMetadata: { contentType }
                });

                return new Response(JSON.stringify({
                    success: true,
                    key,
                    url: `https://pub-e08d5483eda74754bfd9478e2c0a4522.r2.dev/${key}`
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};
