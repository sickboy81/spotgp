import { useState } from 'react';
import { Video, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoGridProps {
    videos: File[];
    onVideosChange: (videos: File[]) => void;
    maxVideos?: number;
}

export function VideoGrid({ 
    videos, 
    onVideosChange, 
    maxVideos = 3
}: VideoGridProps) {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remainingSlots = maxVideos - videos.length;
        const newVideos = files.slice(0, remainingSlots);
        onVideosChange([...videos, ...newVideos]);
    };

    const handleRemove = (index: number) => {
        const newVideos = videos.filter((_, i) => i !== index);
        onVideosChange(newVideos);
    };

    const renderVideoSlot = (index: number) => {
        const video = videos[index];
        const previewUrl = video ? URL.createObjectURL(video) : null;

        return (
            <div
                key={index}
                className={cn(
                    "relative aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-all hover:border-primary",
                    previewUrl && "border-solid"
                )}
                onClick={() => {
                    if (!previewUrl) {
                        document.getElementById(`video-input-${index}`)?.click();
                    }
                }}
            >
                <input
                    id={`video-input-${index}`}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const newVideos = [...videos];
                            newVideos[index] = file;
                            onVideosChange(newVideos);
                        }
                    }}
                />
                
                {previewUrl ? (
                    <>
                        <video 
                            src={previewUrl} 
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
        <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: maxVideos }).map((_, index) => renderVideoSlot(index))}
        </div>
    );
}


