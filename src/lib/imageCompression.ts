/**
 * Image Compression Utility
 * Compresses images before upload to reduce storage and bandwidth
 */
import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    quality?: number;
    fileType?: string;
    onProgress?: (progress: number) => void;
}

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file with metadata
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const originalSize = file.size;

    // Default options optimized for profile photos
    const defaultOptions = {
        maxSizeMB: 1, // Max 1MB after compression
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true, // Use web worker for better performance
        quality: 0.8, // 80% quality
        fileType: 'image/webp', // Use WebP for better compression
    };

    const compressionOptions = {
        ...defaultOptions,
        ...options,
    };

    try {
        const compressedFile = await imageCompression(file, compressionOptions);
        const compressedSize = compressedFile.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        return {
            file: compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
        };
    } catch (error) {
        console.error('Image compression failed:', error);
        // If compression fails, return original file
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 0,
        };
    }
}

/**
 * Compress a profile photo
 * Optimized settings for profile pictures
 */
export async function compressProfilePhoto(
    file: File,
    onProgress?: (progress: number) => void
): Promise<CompressionResult> {
    return compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8,
        fileType: 'image/webp',
        onProgress,
    });
}

/**
 * Compress a verification document
 * Higher quality to maintain readability
 */
export async function compressVerificationDocument(
    file: File,
    onProgress?: (progress: number) => void
): Promise<CompressionResult> {
    return compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        quality: 0.85, // Higher quality for documents
        fileType: 'image/webp',
        onProgress,
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get compression summary message
 */
export function getCompressionSummary(result: CompressionResult): string {
    const originalSize = formatFileSize(result.originalSize);
    const compressedSize = formatFileSize(result.compressedSize);
    const ratio = Math.round(result.compressionRatio);

    if (ratio > 0) {
        return `Comprimido: ${originalSize} → ${compressedSize} (${ratio}% menor)`;
    }
    return `Tamanho: ${compressedSize}`;
}
