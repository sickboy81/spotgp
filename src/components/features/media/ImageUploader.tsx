import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface ImageFileWithPreview {
    file: File;
    preview: string;
    uploaded?: boolean;
    url?: string;
    error?: string;
}

interface ImageUploaderProps {
    onImagesChange: (imageFiles: File[]) => void;
    onUploadedUrlsChange?: (urls: string[]) => void;
    maxImages?: number;
    minImages?: number;
    existingImages?: string[];
    autoUpload?: boolean;
}

export function ImageUploader({
    onImagesChange,
    onUploadedUrlsChange,
    maxImages = 10,
    minImages = 2,
    // existingImages = [], // Unused for now
    autoUpload = false
}: ImageUploaderProps) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<ImageFileWithPreview[]>([]);

    const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: file.type,
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        file.type,
                        quality
                    );
                };
            };
        });
    };

    const uploadImage = async (file: File): Promise<string> => {
        if (!user?.id) {
            throw new Error('Usuário não autenticado');
        }

        let fileToUpload = file;
        if (file.size > 1 * 1024 * 1024) {
            fileToUpload = await compressImage(file);
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('profile_id', user.id); // Assuming we link it to the user
        formData.append('type', 'image');

        try {
            // Create record in 'media' collection
            const record = await pb.collection('media').create(formData);

            // Construct file URL: /api/files/COLLECTION_ID_OR_NAME/RECORD_ID/FILENAME
            const fileUrl = pb.files.getUrl(record, record.file);

            return fileUrl;
        } catch (err: unknown) {
            console.error('Upload failed:', err);
            throw new Error((err as Error).message || 'Falha no upload');
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setError('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(`Alguns arquivos excedem o limite de 5MB.`);
            return;
        }

        if (images.length + imageFiles.length > maxImages) {
            setError(`Você pode adicionar no máximo ${maxImages} imagens.`);
            return;
        }

        const startIndex = images.length;
        const newImages: ImageFileWithPreview[] = imageFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            uploaded: false
        }));

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange(updatedImages.map(img => img.file));

        if (autoUpload && user?.id) {
            setUploading(true);
            const uploadedUrls: string[] = [];

            for (let i = 0; i < newImages.length; i++) {
                const imageIndex = startIndex + i;
                try {
                    setUploadProgress(prev => ({ ...prev, [imageIndex]: 0 }));
                    const url = await uploadImage(newImages[i].file);
                    uploadedUrls.push(url);

                    setImages(prev => prev.map((img, idx) =>
                        idx === imageIndex
                            ? { ...img, uploaded: true, url }
                            : img
                    ));
                    setUploadProgress(prev => ({ ...prev, [imageIndex]: 100 }));
                } catch (err: unknown) {
                    console.error('Error uploading image:', err);
                    setImages(prev => prev.map((img, idx) =>
                        idx === imageIndex
                            ? { ...img, error: (err as Error).message || 'Erro ao fazer upload' }
                            : img
                    ));
                }
            }

            if (onUploadedUrlsChange) {
                onUploadedUrlsChange(uploadedUrls);
            }
            setUploading(false);
        }

        e.target.value = '';
    };

    const handleRemoveImage = (index: number) => {
        if (images[index]?.preview) {
            URL.revokeObjectURL(images[index].preview);
        }

        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages.map(img => img.file));
    };

    const hasMinimumImages = images.length >= minImages;
    const canAddMore = images.length < maxImages;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">
                    Fotos do Perfil {minImages > 0 && <span className="text-destructive">*</span>}
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                    Adicione pelo menos {minImages} fotos. Máximo de {maxImages} fotos permitidas.
                </p>

                {error && (
                    <div className="text-destructive text-sm mb-4 bg-destructive/10 p-2 rounded">
                        {error}
                    </div>
                )}

                {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {images.map((imageData, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                                <img
                                    src={imageData.preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {uploading && uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-white mx-auto mb-2" />
                                            <p className="text-xs text-white">{uploadProgress[index]}%</p>
                                        </div>
                                    </div>
                                )}
                                {imageData.uploaded && (
                                    <div className="absolute top-1 left-1 p-1 bg-green-500 rounded-full">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                {imageData.error && (
                                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                                        <p className="text-xs text-white text-center">{imageData.error}</p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remover imagem"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {index === 0 && (
                                    <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-white text-xs font-medium rounded">
                                        Principal
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {canAddMore && (
                    <label className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors",
                        !hasMinimumImages ? "border-destructive/50" : "border-border"
                    )}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-1 text-sm text-muted-foreground">
                                <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB cada)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                        />
                    </label>
                )}

                {!hasMinimumImages && (
                    <p className="text-sm text-destructive mt-2">
                        Você precisa adicionar pelo menos {minImages} {minImages === 1 ? 'foto' : 'fotos'}.
                    </p>
                )}

                {images.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {images.length} {images.length === 1 ? 'foto adicionada' : 'fotos adicionadas'} {hasMinimumImages && '✓'}
                    </p>
                )}
            </div>
        </div>
    );
}
