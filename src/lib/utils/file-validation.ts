/**
 * Advanced file validation utilities
 * Includes magic bytes validation and MIME type verification
 */

// Magic bytes (file signatures) for common file types
const FILE_SIGNATURES: Record<string, number[][]> = {
    // Images
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header, need to check for WEBP further
    'image/bmp': [[0x42, 0x4D]],
    'image/svg+xml': [], // SVG is text-based, validate differently
    
    // Videos
    'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4
                  [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
                  [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70]],
    'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
    'video/quicktime': [[0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74]],
    
    // Audio
    'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]],
    'audio/wav': [[0x52, 0x49, 0x46, 0x46]],
    'audio/ogg': [[0x4F, 0x67, 0x67, 0x53]],
    
    // Documents
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]],
};

/**
 * Read first bytes of a file
 */
async function readFileHeader(file: File, bytes: number = 12): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const blob = file.slice(0, bytes);
        
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(new Uint8Array(e.target.result as ArrayBuffer));
            } else {
                reject(new Error('Failed to read file header'));
            }
        };
        
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Check if file header matches expected signature
 */
function matchesSignature(header: Uint8Array, signature: number[]): boolean {
    if (header.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
        if (header[i] !== signature[i]) {
            return false;
        }
    }
    
    return true;
}

/**
 * Validate file using magic bytes
 * @param file - File to validate
 * @param expectedMimeType - Expected MIME type
 * @returns true if file signature matches expected type
 */
export async function validateFileSignature(
    file: File,
    expectedMimeType: string
): Promise<{ valid: boolean; error?: string }> {
    try {
        const signatures = FILE_SIGNATURES[expectedMimeType];
        
        // If no signature defined for this type, skip validation
        if (!signatures || signatures.length === 0) {
            // For SVG, do basic text validation
            if (expectedMimeType === 'image/svg+xml') {
                const text = await file.text();
                if (!text.includes('<svg') && !text.includes('<?xml')) {
                    return { valid: false, error: 'Invalid SVG file' };
                }
                return { valid: true };
            }
            
            // For types without signatures, just check MIME type
            return { valid: file.type === expectedMimeType };
        }
        
        // Read file header
        const maxSignatureLength = Math.max(...signatures.map(sig => sig.length));
        const header = await readFileHeader(file, maxSignatureLength);
        
        // Check against all possible signatures for this type
        for (const signature of signatures) {
            if (matchesSignature(header, signature)) {
                // Special check for WebP
                if (expectedMimeType === 'image/webp') {
                    const text = await file.text();
                    if (!text.includes('WEBP')) {
                        return { valid: false, error: 'Invalid WebP file' };
                    }
                }
                
                return { valid: true };
            }
        }
        
        return {
            valid: false,
            error: `File signature does not match expected type: ${expectedMimeType}`
        };
    } catch (error) {
        return {
            valid: false,
            error: `Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Validate file extension matches MIME type
 */
export function validateFileExtension(file: File, allowedExtensions: string[]): boolean {
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
    return allowedExtensions.includes(extension);
}

/**
 * Comprehensive file validation
 * @param file - File to validate
 * @param options - Validation options
 */
export interface FileValidationOptions {
    allowedTypes: string[];
    allowedExtensions: string[];
    maxSize: number; // in bytes
    validateSignature?: boolean; // Whether to validate magic bytes
}

export async function validateFile(
    file: File,
    options: FileValidationOptions
): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // 1. Check file size
    if (file.size > options.maxSize) {
        errors.push(`File size exceeds maximum allowed size of ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // 2. Check MIME type
    if (!options.allowedTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }
    
    // 3. Check file extension
    if (!validateFileExtension(file, options.allowedExtensions)) {
        errors.push(`File extension is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`);
    }
    
    // 4. Validate magic bytes if requested
    if (options.validateSignature && file.type && FILE_SIGNATURES[file.type]) {
        const signatureValidation = await validateFileSignature(file, file.type);
        if (!signatureValidation.valid) {
            errors.push(signatureValidation.error || 'File signature validation failed');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Predefined validation configs for common use cases
 */
export const FILE_VALIDATION_CONFIGS = {
    image: {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxSize: 10 * 1024 * 1024, // 10MB
        validateSignature: true
    },
    video: {
        allowedTypes: ['video/mp4', 'video/webm'],
        allowedExtensions: ['mp4', 'webm'],
        maxSize: 50 * 1024 * 1024, // 50MB
        validateSignature: true
    },
    audio: {
        allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        allowedExtensions: ['mp3', 'wav', 'ogg'],
        maxSize: 10 * 1024 * 1024, // 10MB
        validateSignature: true
    },
    document: {
        allowedTypes: ['application/pdf'],
        allowedExtensions: ['pdf'],
        maxSize: 5 * 1024 * 1024, // 5MB
        validateSignature: true
    }
};


