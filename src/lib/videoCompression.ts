
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

/**
 * Initialize FFmpeg instance
 */
async function loadFFmpeg() {
    if (ffmpeg) return ffmpeg;

    const instance = new FFmpeg();

    // Load FFmpeg WASM from CDN (standard approach for web apps)
    // We use a specific version to ensure compatibility
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await instance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpeg = instance;
    return ffmpeg;
}

export interface VideoCompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
}

/**
 * Compress video file
 * Target: 720p height, crf 28 (good compression), preset veryfast
 */
export async function compressVideo(
    file: File,
    onProgress?: (progress: number) => void
): Promise<VideoCompressionResult> {
    const originalSize = file.size;

    try {
        const ffmpeg = await loadFFmpeg();

        const inputName = 'input.mp4';
        const outputName = 'output.mp4';

        // Write file to FFmpeg FS
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        // Progress handler
        if (onProgress) {
            ffmpeg.on('progress', ({ progress }) => {
                onProgress(Math.round(progress * 100));
            });
        }

        // Run compression command
        // -vf scale=-2:720 : Scale to 720p height, width auto divisible by 2
        // -c:v libx264 : Standard H.264 codec
        // -crf 28 : Constant Rate Factor (higher = more compression, lower quality. 23-28 is good range)
        // -preset veryfast : Fast encoding
        // -an remove audio? No, we want audio.
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', 'scale=-2:720',
            '-c:v', 'libx264',
            '-crf', '28',
            '-preset', 'veryfast',
            '-c:a', 'aac',
            '-b:a', '128k',
            outputName
        ]);

        // Read result
        const data = await ffmpeg.readFile(outputName);
        const compressedBlob = new Blob([data as any], { type: 'video/mp4' });
        const compressedFile = new File([compressedBlob], file.name, { type: 'video/mp4' });

        // Cleanup
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        return {
            file: compressedFile,
            originalSize,
            compressedSize: compressedFile.size
        };

    } catch (error) {
        console.error("Video compression error:", error);
        // Fallback: return original file
        return {
            file,
            originalSize,
            compressedSize: originalSize
        };
    }
}
