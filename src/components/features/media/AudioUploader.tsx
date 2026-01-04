import { useState, useRef } from 'react';
import { Upload, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/utils/file-validation';
import { logger } from '@/lib/utils/logger';

interface AudioUploaderProps {
    audioUrl?: string;
    onAudioChange: (file: File | null) => void;
}

export function AudioUploader({ audioUrl, onAudioChange }: AudioUploaderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(audioBlob);
                const audioFile = new File([audioBlob], 'audio-apresentacao.webm', { type: 'audio/webm' });
                onAudioChange(audioFile);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            logger.error('Error accessing microphone:', error);
            alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Advanced validation with magic bytes
            const validation = await validateFile(file, FILE_VALIDATION_CONFIGS.audio);
            if (!validation.valid) {
                alert(validation.errors.join('. '));
                return;
            }
            onAudioChange(file);
        }
    };

    const handleRemove = () => {
        setRecordedBlob(null);
        onAudioChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const hasAudio = audioUrl || recordedBlob;
    const audioSrc = recordedBlob ? URL.createObjectURL(recordedBlob) : audioUrl;

    return (
        <div className="space-y-4">
            {hasAudio && (
                <div className="relative bg-muted rounded-lg p-4 border border-border">
                    <audio controls src={audioSrc} className="w-full">
                        Seu navegador não suporta o elemento de áudio.
                    </audio>
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                        type="button"
                        aria-label="Remover áudio"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                        isRecording
                            ? "bg-destructive text-white hover:bg-destructive/90"
                            : "bg-green-600 text-white hover:bg-green-700"
                    )}
                >
                    <Mic className="w-4 h-4" />
                    {isRecording ? 'Parar Gravação' : 'Gravar + Carregar áudio'}
                </button>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors font-medium"
                >
                    <Upload className="w-4 h-4" />
                    Carregar arquivo
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Upload de áudio"
                />
            </div>

            <p className="text-xs text-muted-foreground">
                Cada áudio pode durar até 30 segundos. Você pode Gravar um áudio sem sair do formulário, ou Carregar um arquivo de áudio gravado previamente.
            </p>
        </div>
    );
}






