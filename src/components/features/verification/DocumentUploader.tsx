import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressVerificationDocument, getCompressionSummary } from '@/lib/imageCompression';

interface DocumentUploaderProps {
    label: string;
    required?: boolean;
    value?: string | null;
    onChange: (url: string | null) => void;
    onFileSelect?: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
}

export function DocumentUploader({
    label,
    required = false,
    value,
    onChange,
    onFileSelect,
    accept = 'image/*',
    maxSizeMB = 5
}: DocumentUploaderProps) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [compressing, setCompressing] = useState(false);
    const [compressionMessage, setCompressionMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        // Validate file size (before compression)
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`O arquivo deve ter no máximo ${maxSizeMB}MB.`);
            return;
        }

        // Compress image
        setCompressing(true);
        setCompressionMessage('Comprimindo documento...');

        try {
            const result = await compressVerificationDocument(file, (progress) => {
                setCompressionMessage(`Comprimindo: ${Math.round(progress)}%`);
            });

            const summary = getCompressionSummary(result);
            setCompressionMessage(summary);

            // Create preview from compressed file
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setPreview(dataUrl);
                onChange(dataUrl);

                // Clear message after 3 seconds
                setTimeout(() => {
                    setCompressionMessage('');
                    setCompressing(false);
                }, 3000);
            };
            reader.readAsDataURL(result.file);

            if (onFileSelect) {
                onFileSelect(result.file);
            }
        } catch (error) {
            console.error('Compression error:', error);
            setCompressionMessage('Erro ao comprimir. Usando original.');

            // Fallback to original file
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setPreview(dataUrl);
                onChange(dataUrl);

                setTimeout(() => {
                    setCompressionMessage('');
                    setCompressing(false);
                }, 3000);
            };
            reader.readAsDataURL(file);

            if (onFileSelect) {
                onFileSelect(file);
            }
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            {compressionMessage && (
                <div className={cn(
                    "flex items-center gap-2 p-2 rounded text-sm",
                    compressing ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                )}>
                    {compressing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{compressionMessage}</span>
                </div>
            )}

            {preview ? (
                <div className="relative border border-border rounded-lg overflow-hidden bg-muted">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-contain"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 bg-green-500/90 text-white text-xs rounded">
                        <Check className="w-3 h-3" />
                        Documento carregado
                    </div>
                </div>
            ) : (
                <label
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                        "hover:bg-muted/50 border-border hover:border-primary",
                        // uploading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={handleFileSelect}
                        disabled={false}
                    />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm text-foreground">
                            <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-muted-foreground">
                            PNG, JPG ou JPEG (máx. {maxSizeMB}MB)
                        </p>
                    </div>
                </label>
            )}
        </div>
    );
}






