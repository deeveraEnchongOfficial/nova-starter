import { useFileUploader } from '@/Components/file-uploader';
import { useCallback, useState } from 'react';

export interface UploadedFile {
    id: string;
    fileName: string;
    file: File;
    tries: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    uploadId: string;
    url?: string;
}

export interface FileUploadProgress {
    fileName: string;
    progress: number;
    uploadId: string;
}

interface UseFileUploadOptions {
    purpose: string;
    onSuccess?: (file: UploadedFile) => void;
    onError?: (data: { message: string; fileName: string }) => void;
    onProgress?: (progress: FileUploadProgress) => void;
    maxFiles?: number;
}

export function useFileUpload({
    purpose,
    onSuccess,
    onError,
    onProgress,
    maxFiles = Infinity,
}: UseFileUploadOptions) {
    const { upload } = useFileUploader();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<Record<string, number>>({});

    const handleUpload = useCallback(
        async (newFiles: FileList | File[]) => {
            if (!newFiles?.length) return;

            const fileArray = Array.from(newFiles);

            if (files.length + fileArray.length > maxFiles) {
                onError?.({ message: `Maximum ${maxFiles} files allowed`, fileName: '' });
                return;
            }

            setUploading(true);

            const uploadPromises = fileArray.map((file) => {
                return new Promise<void>((resolve) => {
                    const uploadId = `${file.name}-${Date.now()}`;
                    const tempId = `temp-${file.name}-${Date.now()}`;

                    setFiles((prev) => [
                        ...prev,
                        {
                            id: tempId,
                            fileName: file.name,
                            file,
                            tries: 0,
                            status: 'pending',
                            uploadId,
                        },
                    ]);

                    upload({
                        file,
                        purpose,
                        onUploadProgress: (progressData) => {
                            setProgress((prev) => ({
                                ...prev,
                                [uploadId]: progressData.progress,
                            }));
                            onProgress?.({
                                fileName: file.name,
                                progress: progressData.progress,
                                uploadId,
                            });
                        },
                        onSuccess: (result) => {
                            setFiles((prev) =>
                                prev.map((f) =>
                                    f.id === tempId
                                        ? { ...f, id: result.id, status: 'success', url: result.url }
                                        : f,
                                ),
                            );
                            onSuccess?.({
                                id: result.id,
                                fileName: file.name,
                                file,
                                tries: 0,
                                status: 'success',
                                uploadId,
                                url: result.url,
                            });
                            resolve();
                        },
                        onError: (error) => {
                            setFiles((prev) =>
                                prev.map((f) => (f.id === tempId ? { ...f, status: 'error' } : f)),
                            );
                            onError?.({ message: error.message, fileName: file.name });
                            resolve();
                        },
                        onValidationError: (error) => {
                            setFiles((prev) =>
                                prev.map((f) => (f.id === tempId ? { ...f, status: 'error' } : f)),
                            );
                            onError?.({ message: error.message, fileName: file.name });
                            resolve();
                        },
                    });
                });
            });

            await Promise.all(uploadPromises);
            setUploading(false);
        },
        [upload, purpose, files.length, maxFiles, onSuccess, onError, onProgress],
    );

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
        setProgress({});
    }, []);

    return {
        files,
        uploading,
        progress,
        handleUpload,
        removeFile,
        clearFiles,
    };
}
