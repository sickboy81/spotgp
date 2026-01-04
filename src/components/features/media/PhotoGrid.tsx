import { useState } from 'react';
import { Camera, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressProfilePhoto } from '@/lib/imageCompression';

export interface PhotoItem {
    id?: string; // ID of the media record if existing
    url: string; // URL for preview (remote or objectURL)
    file?: File; // File object if new
    isCover?: boolean; // If we want to track cover status
}

interface PhotoGridProps {
    photos: PhotoItem[];
    onPhotosChange: (photos: PhotoItem[]) => void;
    maxPhotos?: number;
    maxColumns?: number;
}

export function PhotoGrid({
    photos,
    onPhotosChange,
    maxPhotos = 12,
    maxColumns = 3
}: PhotoGridProps) {
    const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
    const [compressing, setCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [compressionMessage, setCompressionMessage] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleRemove = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
        if (coverPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
            setCoverPhotoIndex(0);
        }
    };

    const handleSetCover = (index: number) => {
        setCoverPhotoIndex(index);
        const newPhotos = [...photos];
        const [selectedPhoto] = newPhotos.splice(index, 1);
        newPhotos.unshift(selectedPhoto);
        onPhotosChange(newPhotos);
        setCoverPhotoIndex(0);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newPhotos = [...photos];
        const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
        newPhotos.splice(dropIndex, 0, draggedPhoto);

        onPhotosChange(newPhotos);

        // Update cover index if needed
        if (draggedIndex === coverPhotoIndex) {
            setCoverPhotoIndex(dropIndex);
        } else if (draggedIndex < coverPhotoIndex && dropIndex >= coverPhotoIndex) {
            setCoverPhotoIndex(coverPhotoIndex - 1);
        } else if (draggedIndex > coverPhotoIndex && dropIndex <= coverPhotoIndex) {
            setCoverPhotoIndex(coverPhotoIndex + 1);
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const renderPhotoSlot = (index: number) => {
        const photo = photos[index];
        const isCover = index === coverPhotoIndex;

        return (
            <div
                key={index}
                draggable={!!photo}
                onDragStart={() => photo && handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                    "relative aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center transition-all",
                    photo ? "cursor-move hover:border-primary" : "cursor-pointer hover:border-primary",
                    isCover && "border-primary border-solid ring-2 ring-primary/50",
                    photo && "border-solid",
                    draggedIndex === index && "opacity-50 scale-95",
                    dragOverIndex === index && draggedIndex !== index && "ring-2 ring-blue-500 scale-105"
                )}
                onClick={() => {
                    if (photo) {
                        handleSetCover(index);
                    } else {
                        document.getElementById(`photo-input-${index}`)?.click();
                    }
                }}
            >
                <input
                    id={`photo-input-${index}`}
                    aria-label={`Upload de foto ${index + 1}`}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        setCompressing(true);
                        setCompressionProgress(0);
                        setCompressionMessage(`Comprimindo ${files.length} ${files.length === 1 ? 'imagem' : 'imagens'}...`);

                        try {
                            const compressedPhotos: PhotoItem[] = [];
                            let totalReduction = 0;

                            for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const progress = ((i + 1) / files.length) * 100;
                                setCompressionProgress(progress);
                                setCompressionMessage(`Comprimindo ${i + 1}/${files.length}...`);

                                const result = await compressProfilePhoto(file);
                                totalReduction += result.compressionRatio;

                                compressedPhotos.push({
                                    url: URL.createObjectURL(result.file),
                                    file: result.file
                                });
                            }

                            const avgReduction = Math.round(totalReduction / files.length);
                            setCompressionMessage(`${files.length} ${files.length === 1 ? 'foto comprimida' : 'fotos comprimidas'} (${avgReduction}% menor em média)`);

                            // Add all compressed photos, respecting maxPhotos limit
                            const availableSlots = maxPhotos - photos.length;
                            const photosToAdd = compressedPhotos.slice(0, availableSlots);
                            onPhotosChange([...photos, ...photosToAdd]);

                            if (compressedPhotos.length > availableSlots) {
                                setTimeout(() => {
                                    setCompressionMessage(`Adicionadas ${photosToAdd.length} de ${compressedPhotos.length} fotos (limite: ${maxPhotos})`);
                                }, 3000);
                            }

                            // Clear message after 3 seconds
                            setTimeout(() => {
                                setCompressionMessage('');
                                setCompressing(false);
                            }, 3000);
                        } catch (error) {
                            console.error('Compression error:', error);
                            setCompressionMessage('Erro ao comprimir. Usando originais.');

                            // Fallback to original files
                            const fallbackPhotos: PhotoItem[] = files.map(file => ({
                                url: URL.createObjectURL(file),
                                file: file
                            }));

                            const availableSlots = maxPhotos - photos.length;
                            const photosToAdd = fallbackPhotos.slice(0, availableSlots);
                            onPhotosChange([...photos, ...photosToAdd]);

                            setTimeout(() => {
                                setCompressionMessage('');
                                setCompressing(false);
                            }, 3000);
                        }

                        e.target.value = '';
                    }}
                />

                {photo ? (
                    <>
                        <img
                            src={photo.url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                        />
                        {isCover && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-bold">
                                CAPA
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(index);
                            }}
                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors"
                            aria-label={`Remover foto ${index + 1}`}
                            type="button"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Camera className="w-8 h-8" />
                        <Plus className="w-4 h-4" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "grid gap-4",
                    maxColumns === 3 ? "grid-cols-3" : `grid-cols-${maxColumns}`
                )}
            >
                {Array.from({ length: maxPhotos }).map((_, index) => renderPhotoSlot(index))}
            </div>

            {compressionMessage && (
                <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    compressing ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                )}>
                    {compressing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{compressionMessage}</span>
                </div>
            )}

            {photos.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-2">
                    <div>
                        <p className="font-semibold text-foreground mb-1">FOTO DA CAPA:</p>
                        <p>Clique na foto que você quer que seja a primeira. Será a foto da capa que aparece nas listas.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground mb-1">REORDENAR FOTOS:</p>
                        <p>Arraste e solte as fotos para mudar a ordem de exibição.</p>
                    </div>
                </div>
            )}
        </div>
    );
}





