import { useState } from 'react';
import { Video, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressProfileVideo, getVideoCompressionSummary } from '@/lib/videoCompression';

export interface VideoItem {
    id?: string;
    url: string;
    file?: File;
}

interface VideoGridProps {
    videos: VideoItem[];
    onVideosChange: (videos: VideoItem[]) => void;
    maxVideos?: number;
}

export function VideoGrid({
    videos,
    onVideosChange,
    maxVideos = 3
}: VideoGridProps) {
    const [compressing, setCompressing] = useState(false);
    const [compressionMessage, setCompressionMessage] = useState('');

    const handleRemove = (index: number) => {
        const newVideos = videos.filter((_, i) => i !== index);
        onVideosChange(newVideos);
    };

    const renderVideoSlot = (index: number) => {
        const video = videos[index];

        return (
            <div
                key={index}
                className={cn(
                    "relative aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-all hover:border-primary",
                    video && "border-solid"
                )}
                onClick={() => {
                    if (!video) {
                        document.getElementById(`video-input-${index}`)?.click();
                    }
                }}
            >
                <input
                    id={`video-input-${index}`}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    aria-label={`Upload de vídeo ${index + 1}`}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setCompressing(true);
                            setCompressionProgress(0);
                            setCompressionMessage('Carregando compressor de vídeo...');

                            try {
                                const result = await compressProfileVideo(file, (progress) => {
                                    if (progress < 15) {
                                        setCompressionMessage('Carregando compressor...');
                                    } else if (progress < 20) {
                                        setCompressionMessage('Preparando vídeo...');
                                    } else if (progress < 95) {
                                        setCompressionMessage(`Comprimindo vídeo... ${Math.round(progress)}%`);
                                    } else {
                                        setCompressionMessage('Finalizando...');
                                    }
                                });

                                const summary = getVideoCompressionSummary(result);
                                setCompressionMessage(summary);

                                const newVideo: VideoItem = {
                                    url: URL.createObjectURL(result.file),
                                    file: result.file
                                };
                                onVideosChange([...videos, newVideo]);

                                // Clear message after 5 seconds
                                setTimeout(() => {
                                    setCompressionMessage('');
                                    setCompressing(false);
                                }, 5000);
                            } catch (error) {
                                console.error('Video compression error:', error);
                                setCompressionMessage('Falha na compressão. Por favor, tente novamente ou escolha outro vídeo.');

                                // Do not add fallback video

                                setTimeout(() => {
                                    setCompressionMessage('');
                                    setCompressing(false);
                                }, 4000);
                            }

                            e.target.value = '';
                        }
                    }}
                />

                {video ? (
                    <>
                        <video
                            src={video.url}
                            className="w-full h-full object-cover rounded-lg"
                            controls={false}
                            muted
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(index);
                            }}
                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors"
                            aria-label={`Remover vídeo ${index + 1}`}
                            type="button"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Video className="w-8 h-8" />
                        <Plus className="w-4 h-4" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: maxVideos }).map((_, index) => renderVideoSlot(index))}
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
        </div>
    );
}




