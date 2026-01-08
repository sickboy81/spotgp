import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default (router, context) => {
    const { env, logger } = context;

    // Initialize S3 Client with credentials from Directus environment variables
    const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    });

    router.post('/sign', async (req, res) => {
        // Security Check: Ensure user is authenticated
        if (!req.accountability || !req.accountability.user) {
            return res.status(403).json({ error: 'Forbidden: Authentication required' });
        }

        const { fileName, contentType } = req.body;
        // Use R2_BUCKET_NAME from environment
        const bucket = env.R2_BUCKET_NAME;

        if (!fileName || !contentType) {
            return res.status(400).json({ error: 'Missing parameters: fileName or contentType' });
        }

        if (!bucket) {
            logger.error('R2_BUCKET_NAME not configured in Directus environment');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Generate a unique key for the file
        const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });

        try {
            // Generate Signed URL valid for 5 minutes (300 seconds)
            const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
            res.json({ signedUrl, key });
        } catch (error) {
            logger.error('Saphira Signer Error:', error);
            res.status(500).json({ error: 'Failed to generate signed URL' });
        }
    });
};
