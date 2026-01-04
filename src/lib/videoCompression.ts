/**
 * Video Compression Utility using FFmpeg.wasm
 * Compresses videos before upload to reduce storage and bandwidth
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;

export interface VideoCompressionOptions {
    maxSizeMB?: number;
    maxDuration?: number; // in seconds
    quality?: 'low' | 'medium' | 'high';
    onProgress?: (progress: number) => void;
}

export interface VideoCompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    duration?: number;
}

/**
 * Load FFmpeg instance (lazy loading)
 */
async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    if (ffmpegInstance) {
        return ffmpegInstance;
    }

    if (isLoading) {
        // Wait for loading to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return ffmpegInstance!;
    }

    isLoading = true;

    try {
        const ffmpeg = new FFmpeg();

        ffmpeg.on('log', ({ message }) => {
            console.log('FFmpeg:', message);
        });

        ffmpeg.on('progress', ({ progress }) => {
            if (onProgress) {
                onProgress(progress * 100);
            }
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegInstance = ffmpeg;
        isLoading = false;
        return ffmpeg;
    } catch (error) {
        isLoading = false;
        throw error;
    }
}

/**
 * Get video quality settings
 */
function getQualitySettings(quality: 'low' | 'medium' | 'high') {
    switch (quality) {
        case 'low':
            return {
                crf: '28', // Higher CRF = lower quality, smaller size
                preset: 'veryfast',
                maxBitrate: '500k'
            };
        case 'medium':
            return {
                crf: '23',
                preset: 'medium',
                maxBitrate: '1000k'
            };
        case 'high':
            return {
                crf: '18',
                preset: 'slow',
                maxBitrate: '2000k'
            };
    }
}

/**
 * Compress a video file
 */
export async function compressVideo(
    file: File,
    options: VideoCompressionOptions = {}
): Promise<VideoCompressionResult> {
    const {
        quality = 'medium',
        maxDuration,
        onProgress
    } = options;

    const originalSize = file.size;

    try {
        // Load FFmpeg
        onProgress?.(5);
        const ffmpeg = await loadFFmpeg((progress) => {
            // Map loading progress to 5-15%
            onProgress?.(5 + progress * 0.1);
        });

        // Write input file
        onProgress?.(15);
        await ffmpeg.writeFile('input.mp4', await fetchFile(file));

        // Get quality settings
        const settings = getQualitySettings(quality);

        // Build FFmpeg command
        const args = [
            '-i', 'input.mp4',
            '-c:v', 'libx264', // H.264 codec
            '-crf', settings.crf,
            '-preset', settings.preset,
            '-maxrate', settings.maxBitrate,
            '-bufsize', '2M',
            '-c:a', 'aac', // AAC audio codec
            '-b:a', '128k', // Audio bitrate
            '-movflags', '+faststart', // Enable streaming
        ];

        // Add duration limit if specified
        if (maxDuration) {
            args.push('-t', maxDuration.toString());
        }

        // Scale down if needed (max 1280x720 for medium quality)
        if (quality === 'low') {
            args.push('-vf', 'scale=640:480:force_original_aspect_ratio=decrease');
        } else if (quality === 'medium') {
            args.push('-vf', 'scale=1280:720:force_original_aspect_ratio=decrease');
        }

        args.push('output.mp4');

        // Execute compression
        onProgress?.(20);
        await ffmpeg.exec(args);

        // Read output file
        onProgress?.(95);
        const data = await ffmpeg.readFile('output.mp4');

        // Create blob and file
        const blob = new Blob([data as any], { type: 'video/mp4' });
        const compressedSize = blob.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4',
            { type: 'video/mp4' }
        );

        // Cleanup
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.mp4');

        onProgress?.(100);

        return {
            file: compressedFile,
            originalSize,
            compressedSize,
            compressionRatio: Math.max(0, compressionRatio)
        };
    } catch (error) {
        console.error('Video compression failed:', error);
        throw error;
    }
}

/**
 * Compress a profile video (optimized for short clips)
 */
export async function compressProfileVideo(
    file: File,
    onProgress?: (progress: number) => void
): Promise<VideoCompressionResult> {
    return compressVideo(file, {
        quality: 'medium',
        maxDuration: 30, // Limit to 30 seconds
        onProgress
    });
}

/**
 * Get compression summary message
 */
export function getVideoCompressionSummary(result: VideoCompressionResult): string {
    const originalSize = formatFileSize(result.originalSize);
    const compressedSize = formatFileSize(result.compressedSize);
    const ratio = Math.round(result.compressionRatio);

    if (ratio > 0) {
        return `Vídeo comprimido: ${originalSize} → ${compressedSize} (${ratio}% menor)`;
    }
    return `Tamanho: ${compressedSize}`;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
