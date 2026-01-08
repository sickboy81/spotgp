import { directus } from '@/lib/directus';

// R2 Configuration
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

interface SignerResponse {
    signedUrl: string;
    key?: string;
}

export async function uploadToR2(file: File, folder: string = 'uploads'): Promise<string> {
    if (!R2_BUCKET_NAME) throw new Error("R2 Bucket Name not configured");

    const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
        console.log('Solicitando URL assinada para:', fileName);

        // Use Directus SDK to request signed URL from our custom extension
        // NOTE: This requires the 'directus-extension-saphira-signer' to be installed on server
        const response = await directus.request<SignerResponse>(() => ({
            path: '/saphira-signer/sign',
            method: 'POST',
            body: JSON.stringify({
                fileName: fileName,
                contentType: file.type || 'application/octet-stream'
            })
        }));

        // For endpoints in Directus, response is usually the data object directly if using SDK correct wrapper,
        // but raw request returns: { signedUrl, key }

        // Cast to unknown first if needed, but TypeScript should accept generic above
        const data = response as unknown as SignerResponse;

        if (!data || !data.signedUrl) {
            console.error('Resposta do signer:', response);
            throw new Error('Falha ao obter URL assinada do servidor.');
        }

        const { signedUrl } = data;

        // Upload to R2 using the signed URL
        await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type || 'application/octet-stream'
            }
        });

        const baseUrl = R2_PUBLIC_URL || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;
        return `${baseUrl}/${fileName}`;

    } catch (error) {
        console.error("Erro no upload seguro:", error);
        throw new Error("Falha no upload. Verifique se a extensão 'saphira-signer' está instalada no Directus.");
    }
}
