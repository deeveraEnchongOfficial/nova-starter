import axios from 'axios';
import { uniqueId } from 'lodash';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export interface UploadEntry {
    file: File;
    key: string;
    purpose: string;
    category?: string | null;
    description?: string | null;
}

export interface ProgressData {
    progress: number;
    loaded: number;
    total: number;
}

export interface SuccessData {
    id: string;
    url?: string;
}

export interface ErrorData {
    status?: number;
    statusText?: string;
    message: string;
    errors?: Record<string, string[]>;
    root: unknown;
}

type ProgressListener = (data: ProgressData, key: string) => void;
type SuccessListener = (data: SuccessData, key: string) => void;
type ErrorListener = (data: ErrorData, key: string) => void;

const CATCH_ALL_KEY = '*';

interface EnqueueOptions {
    file: File;
    key?: string;
    purpose: string;
    category?: string | null;
    description?: string | null;
    onUploadProgress?: ProgressListener | null;
    onSuccess?: SuccessListener | null;
    onError?: ErrorListener | null;
    onValidationError?: ErrorListener | null;
}

interface FileUploaderContextValue {
    upload: (options: EnqueueOptions) => string;
}

const UploaderContext = createContext<FileUploaderContextValue | null>(null);

async function uploadFile(
    entry: UploadEntry,
    progressListeners: ProgressListener[],
    successListeners: SuccessListener[],
    validationErrorListeners: ErrorListener[],
    errorListeners: ErrorListener[],
): Promise<void> {
    const httpClient = window.axios || axios;

    try {
        const initiateResponse = await httpClient.post('/api/v1/files/initiate', {
            content_type: entry.file.type,
            content_size: entry.file.size,
            purpose: entry.purpose,
        });

        const headers: Record<string, string> = initiateResponse.data.headers;

        if ('Host' in headers) {
            delete headers['Host'];
        }

        await httpClient.put(initiateResponse.data.url, entry.file, {
            headers,
            onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
                const total = progressEvent.total ?? 0;
                progressListeners.forEach((listener) =>
                    listener(
                        {
                            progress: progressEvent.loaded / (total + 1),
                            loaded: progressEvent.loaded,
                            total,
                        },
                        entry.key,
                    ),
                );
            },
        });

        const confirmResponse = await httpClient.post('/api/v1/files/confirm', {
            purpose: entry.purpose,
            key: initiateResponse.data.key,
            name: entry.file.name,
            category: entry.category,
            description: entry.description || null,
        });

        successListeners.forEach((listener) =>
            listener(
                {
                    id: confirmResponse.data.id,
                    url: confirmResponse.data.url,
                },
                entry.key,
            ),
        );
    } catch (error: unknown) {
        const err = error as { status?: number; statusText?: string; response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        if (err.status === 422) {
            validationErrorListeners.forEach((listener) =>
                listener(
                    {
                        status: err.status,
                        statusText: err.statusText,
                        message: err.response?.data?.message || 'Validation failed',
                        errors: err.response?.data?.errors,
                        root: error,
                    },
                    entry.key,
                ),
            );
        } else {
            errorListeners.forEach((listener) =>
                listener(
                    {
                        status: err.status,
                        statusText: err.statusText,
                        message: err.response?.data?.message || 'Upload failed',
                        root: error,
                    },
                    entry.key,
                ),
            );
        }
    }
}

export function FileUploaderProvider({ children }: { children: ReactNode }) {
    const [queue, setQueue] = useState<UploadEntry[]>([]);
    const [progressListeners, setProgressListeners] = useState<Record<string, ProgressListener[]>>({});
    const [successListeners, setSuccessListeners] = useState<Record<string, SuccessListener[]>>({});
    const [errorListeners, setErrorListeners] = useState<Record<string, ErrorListener[]>>({});
    const [validationErrorListeners, setValidationErrorListeners] = useState<Record<string, ErrorListener[]>>({});

    useEffect(() => {
        if (queue.length > 0) {
            const newQueue = [...queue];
            const entry = newQueue.shift()!;

            uploadFile(
                entry,
                [
                    ...(progressListeners[entry.key] || []),
                    ...(progressListeners[CATCH_ALL_KEY] || []),
                ],
                [
                    ...(successListeners[entry.key] || []),
                    ...(successListeners[CATCH_ALL_KEY] || []),
                ],
                [
                    ...(validationErrorListeners[entry.key] || []),
                    ...(validationErrorListeners[CATCH_ALL_KEY] || []),
                ],
                [
                    ...(errorListeners[entry.key] || []),
                    ...(errorListeners[CATCH_ALL_KEY] || []),
                ],
            );

            setQueue(newQueue);
        }
    }, [queue]); // eslint-disable-line react-hooks/exhaustive-deps

    const upload = useCallback(
        ({
            file,
            key,
            purpose,
            category = null,
            description = null,
            onUploadProgress = null,
            onSuccess = null,
            onError = null,
            onValidationError = null,
        }: EnqueueOptions): string => {
            const uploadKey = key || uniqueId();

            setQueue((prevQueue) => [
                ...prevQueue,
                { file, key: uploadKey, purpose, category, description },
            ]);

            if (onUploadProgress) {
                setProgressListeners((prev) => ({
                    ...prev,
                    [uploadKey]: prev[uploadKey] ? [...prev[uploadKey], onUploadProgress] : [onUploadProgress],
                }));
            }

            if (onSuccess) {
                setSuccessListeners((prev) => ({
                    ...prev,
                    [uploadKey]: prev[uploadKey] ? [...prev[uploadKey], onSuccess] : [onSuccess],
                }));
            }

            if (onError) {
                setErrorListeners((prev) => ({
                    ...prev,
                    [uploadKey]: prev[uploadKey] ? [...prev[uploadKey], onError] : [onError],
                }));
            }

            if (onValidationError) {
                setValidationErrorListeners((prev) => ({
                    ...prev,
                    [uploadKey]: prev[uploadKey] ? [...prev[uploadKey], onValidationError] : [onValidationError],
                }));
            }

            return uploadKey;
        },
        [],
    );

    const value = useMemo(() => ({ upload }), [upload]);

    return <UploaderContext.Provider value={value}>{children}</UploaderContext.Provider>;
}

export function useFileUploader(): FileUploaderContextValue {
    const context = useContext(UploaderContext);

    if (!context) {
        throw new Error('useFileUploader must be used within a FileUploaderProvider');
    }

    return context;
}

export default FileUploaderProvider;
