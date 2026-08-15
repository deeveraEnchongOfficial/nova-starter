import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, FileAudio } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

export interface PreviewableFile {
    id: string;
    name: string;
    mime_type: string;
    size: number;
}

interface FilePreviewDialogProps {
    /** The currently previewed file, or null when closed */
    file: PreviewableFile | null;
    /** Called when the dialog requests to close */
    onClose: () => void;
    /** Navigate to the previous image (no-op if none) */
    onPrev?: () => void;
    /** Navigate to the next image (no-op if none) */
    onNext?: () => void;
}

const isImage = (mimeType: string) => mimeType.startsWith('image/');
const isVideo = (mimeType: string) => mimeType.startsWith('video/');
const isAudio = (mimeType: string) => mimeType.startsWith('audio/');

export default function FilePreviewDialog({
    file,
    onClose,
    onPrev,
    onNext,
}: FilePreviewDialogProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Fetch presigned URL whenever the file changes
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            setPreviewLoading(false);
            return;
        }

        let cancelled = false;
        setPreviewUrl(null);
        setPreviewLoading(true);

        axios
            .get(`/api/v1/files/${file.id}/download`)
            .then((res) => {
                if (!cancelled) setPreviewUrl(res.data.url);
            })
            .catch(() => {
                if (!cancelled) setPreviewUrl(null);
            })
            .finally(() => {
                if (!cancelled) setPreviewLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [file]);

    // Keyboard navigation (only for images)
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!file || !isImage(file.mime_type)) return;
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
            if (e.key === 'ArrowRight' && onNext) onNext();
        },
        [file, onPrev, onNext],
    );

    useEffect(() => {
        if (!file) return;
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [file, handleKeyDown]);

    const canNavigate = file && isImage(file.mime_type) && (onPrev || onNext);

    return (
        <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-none! gap-0! p-0! w-[95vw] h-[95vh] flex flex-col">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="truncate">{file?.name}</DialogTitle>
                </DialogHeader>
                <div className="relative flex overflow-auto flex-1 justify-center items-center bg-black/5">
                    {/* Navigation arrows (images only) */}
                    {canNavigate && onPrev && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 z-10 bg-white/80 hover:bg-white/90 shadow-md"
                            onClick={onPrev}
                        >
                            <ChevronLeft className="size-6" />
                        </Button>
                    )}
                    {canNavigate && onNext && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 z-10 bg-white/80 hover:bg-white/90 shadow-md"
                            onClick={onNext}
                        >
                            <ChevronRight className="size-6" />
                        </Button>
                    )}

                    {previewLoading ? (
                        <p className="text-muted-foreground">Loading...</p>
                    ) : previewUrl ? (
                        isImage(file?.mime_type ?? '') ? (
                            <img
                                src={previewUrl}
                                alt={file?.name}
                                className="object-contain max-w-full max-h-full"
                            />
                        ) : isVideo(file?.mime_type ?? '') ? (
                            <video
                                src={previewUrl}
                                controls
                                autoPlay
                                className="object-contain max-w-full max-h-full"
                            >
                                Your browser does not support video playback.
                            </video>
                        ) : isAudio(file?.mime_type ?? '') ? (
                            <div className="flex flex-col gap-4 items-center p-8 w-full max-w-md">
                                <FileAudio className="w-24 h-24 text-green-500" />
                                <p className="text-sm text-muted-foreground">{file?.name}</p>
                                <audio
                                    src={previewUrl}
                                    controls
                                    autoPlay
                                    className="w-full"
                                >
                                    Your browser does not support audio playback.
                                </audio>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Preview not available</p>
                        )
                    ) : (
                        <p className="text-muted-foreground">Failed to load preview</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
