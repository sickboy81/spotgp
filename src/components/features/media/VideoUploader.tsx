import React, { useState } from 'react';
import { X, Film } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
    onUploadComplete?: () => void;
}

export function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                setError("File size exceeds 50MB limit.");
                return;
            }

            // Validate type
            if (!file.type.startsWith('video/')) {
                setError("Please select a valid video file.");
                return;
            }

            setVideoFile(file);
        }
    };

    const handleUpload = async () => {
        if (!videoFile || !user) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', videoFile);
            formData.append('profile_id', user.id);
            formData.append('type', 'video');

            await pb.collection('media').create(formData);

            setVideoFile(null);
            if (onUploadComplete) onUploadComplete();
            alert("Video uploaded successfully!");

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-card/50">
            <div className="mb-4 flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Film className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Upload Profile Video</h3>
                <p className="text-sm text-muted-foreground">MP4, WebM up to 50MB</p>
            </div>

            {error && (
                <div className="text-destructive text-sm mb-4 bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            {!videoFile ? (
                <div>
                    <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors inline-block">
                        Select Video
                        <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleFileSelect}
                        />
                    </label>
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-2 text-sm bg-muted px-3 py-1 rounded-full">
                        <span>{videoFile.name}</span>
                        <button onClick={() => setVideoFile(null)} className="text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={cn(
                            "bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium transition-opacity",
                            uploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {uploading ? 'Uploading...' : 'Start Upload'}
                    </button>
                </div>
            )}
        </div>
    );
}
