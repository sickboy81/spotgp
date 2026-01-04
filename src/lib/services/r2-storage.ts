import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// R2 Configuration
// Note: In production, these should not be exposed in the frontend if possible.
// Use a proxy or signed URLs. For this implementation as requested, we use client-side keys.

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL; // e.g., https://pub-xxx.r2.dev

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.warn("R2 Credentials missing in environment variables.");
}

const R2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function uploadToR2(file: File, folder: string = 'uploads'): Promise<string> {
    if (!R2_BUCKET_NAME) throw new Error("R2 Bucket Name not configured");

    const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Determine content type
    const contentType = file.type || 'application/octet-stream';

    // Convert File to ArrayBuffer/Uint8Array to avoid "readableStream.getReader is not a function" error
    // in some browser environments with AWS SDK v3
    const arrayBuffer = await file.arrayBuffer();
    const fileBody = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBody,
        ContentType: contentType,
        ContentLength: arrayBuffer.byteLength, // Explicitly set length
    });

    try {
        await R2Client.send(command);
        // Construct Public URL
        // If user provided a custom domain or .r2.dev URL
        const baseUrl = R2_PUBLIC_URL || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;
        return `${baseUrl}/${fileName}`;
    } catch (error) {
        console.error("Error uploading to R2:", error);
        throw error;
    }
}
