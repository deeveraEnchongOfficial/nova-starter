import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Folder as FolderIcon,
    File as FileIcon,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileCode,
    FileArchive,
    FileSpreadsheet,
    Star,
    Trash2,
    Download,
    MoreVertical,
    Eye,
    Play,
    Share2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';
import FilesTabs from '@/Components/FilesTabs';
import ImageThumbnail from '@/Components/ImageThumbnail';
import { useAudioPlayer, type AudioTrack } from '@/contexts/AudioPlayerContext';
import ShareDialog from '@/Components/ShareDialog';

interface StarredFolder {
    id: string;
    name: string;
    is_starred: boolean;
    color: string | null;
}

interface StarredFile {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    is_starred: boolean;
    url: string;
    created_at: string;
}

export default function FilesStarred({
    starredFolders,
    starredFiles,
}: PageProps<{
    starredFolders: StarredFolder[];
    starredFiles: StarredFile[];
}>) {
    const [previewFile, setPreviewFile] = useState<StarredFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [shareTarget, setShareTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
    const { play: playAudio } = useAudioPlayer();

    const handlePlayAudio = useCallback((file: StarredFile) => {
        const audioFiles = starredFiles.filter((f) => f.mime_type.startsWith('audio/'));
        const track: AudioTrack = { id: file.id, name: file.name, mime_type: file.mime_type, size: file.size };
        const playlist: AudioTrack[] = audioFiles.map((f) => ({
            id: f.id, name: f.name, mime_type: f.mime_type, size: f.size,
        }));
        playAudio(track, playlist);
    }, [starredFiles, playAudio]);

    const handleToggleStar = useCallback(async (type: 'file' | 'folder', id: string) => {
        const endpoint = type === 'file' ? `/api/v1/files/${id}/star` : `/api/v1/folders/${id}/star`;
        await axios.post(endpoint);
        router.reload({ only: ['starredFolders', 'starredFiles'] });
    }, []);

    const handleDownload = useCallback(async (id: string) => {
        const response = await axios.get(`/api/v1/files/${id}/download`);
        window.open(response.data.url, '_blank');
    }, []);

    const handleDeleteFile = useCallback(async (id: string) => {
        await axios.delete(`/api/v1/files/${id}`);
        router.reload({ only: ['starredFolders', 'starredFiles'] });
    }, []);

    const handleDeleteFolder = useCallback(async (id: string) => {
        await axios.delete(`/api/v1/folders/${id}`);
        router.reload({ only: ['starredFolders', 'starredFiles'] });
    }, []);

    const isPreviewable = (mimeType: string) => {
        return mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/');
    };

    const isImage = (mimeType: string) => mimeType.startsWith('image/');
    const isVideo = (mimeType: string) => mimeType.startsWith('video/');
    const isAudio = (mimeType: string) => mimeType.startsWith('audio/');

    const handlePreview = useCallback(async (file: StarredFile) => {
        setPreviewFile(file);
        setPreviewUrl(null);
        setPreviewLoading(true);
        try {
            const response = await axios.get(`/api/v1/files/${file.id}/download`);
            setPreviewUrl(response.data.url);
        } catch {
            setPreviewUrl(null);
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!previewFile) {
            setPreviewUrl(null);
            setPreviewLoading(false);
        }
    }, [previewFile]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const getFileIcon = (mimeType: string, name?: string) => {
        const ext = name?.split('.').pop()?.toLowerCase() ?? '';

        if (mimeType.startsWith('image/')) return <FileImage className="w-8 h-8 text-blue-500" />;
        if (mimeType.startsWith('video/')) return <FileVideo className="w-8 h-8 text-purple-500" />;
        if (mimeType.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-green-500" />;
        if (mimeType.includes('pdf') || ext === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed'))
            return <FileArchive className="w-8 h-8 text-amber-600" />;
        if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
            return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
        if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext) || mimeType.includes('document') || mimeType.includes('msword') || mimeType.startsWith('text/'))
            return <FileText className="w-8 h-8 text-blue-600" />;
        if (['js', 'ts', 'jsx', 'tsx', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql'].includes(ext))
            return <FileCode className="w-8 h-8 text-cyan-600" />;
        return <FileIcon className="w-8 h-8 text-gray-500" />;
    };

    const getFileDisplay = (file: StarredFile) => {
        if (file.mime_type.startsWith('image/')) {
            return <ImageThumbnail src={file.url} alt={file.name} className="w-12 h-12" />;
        }
        return getFileIcon(file.mime_type, file.name);
    };

    const folderColorClass = (color: string | null) => {
        const colorMap: Record<string, string> = {
            blue: 'text-blue-500',
            green: 'text-green-500',
            red: 'text-red-500',
            purple: 'text-purple-500',
            orange: 'text-orange-500',
            pink: 'text-pink-500',
            yellow: 'text-yellow-500',
            gray: 'text-gray-500',
        };
        return color ? (colorMap[color] || 'text-yellow-500') : 'text-yellow-500';
    };

    const totalItems = starredFolders.length + starredFiles.length;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Starred</h2>}>
            <Head title="Starred" />

            <div className="flex flex-col gap-4 h-full">
                <FilesTabs active="starred" />

                <div className="overflow-auto flex-1">
                    {totalItems === 0 ? (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                            <div className="text-center">
                                <Star className="mx-auto mb-2 w-12 h-12 opacity-50" />
                                <p>No starred items</p>
                                <p className="text-sm">Star files and folders to find them quickly here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {starredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="flex relative flex-col items-center p-4 rounded-lg border cursor-pointer group hover:bg-accent"
                                    onDoubleClick={() => router.visit(route('files.index', { folder_id: folder.id }))}
                                >
                                    <FolderIcon className={`h-12 w-12 ${folderColorClass(folder.color)}`} />
                                    <p className="mt-2 w-full text-sm font-medium text-center truncate">{folder.name}</p>
                                    <div className="flex absolute top-1 right-1 items-center opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar('folder', folder.id);
                                            }}
                                            className="p-1 rounded hover:bg-accent-foreground/10"
                                        >
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        </button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1 rounded hover:bg-accent-foreground/10"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onClick={() => handleToggleStar('folder', folder.id)}>
                                                    <Star className="mr-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    Unstar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setShareTarget({ type: 'folder', id: folder.id, name: folder.name })}>
                                                    <Share2 className="mr-2 w-4 h-4" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteFolder(folder.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 w-4 h-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                            {starredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex relative flex-col items-center p-4 rounded-lg border cursor-pointer group hover:bg-accent"
                                    onDoubleClick={() => isPreviewable(file.mime_type) ? handlePreview(file) : handleDownload(file.id)}
                                >
                                    <div className="flex justify-center items-center shrink-0">
                                        {getFileDisplay(file)}
                                    </div>
                                    <p className="mt-2 w-full text-sm font-medium text-center truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                                    <div className="flex absolute top-1 right-1 items-center opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar('file', file.id);
                                            }}
                                            className="p-1 rounded hover:bg-accent-foreground/10"
                                        >
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        </button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1 rounded hover:bg-accent-foreground/10"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                {file.mime_type.startsWith('audio/') && (
                                                    <DropdownMenuItem onClick={() => handlePlayAudio(file)}>
                                                        <Play className="mr-2 w-4 h-4" />
                                                        Play
                                                    </DropdownMenuItem>
                                                )}
                                                {isPreviewable(file.mime_type) && (
                                                    <DropdownMenuItem onClick={() => handlePreview(file)}>
                                                        <Eye className="mr-2 w-4 h-4" />
                                                        Preview
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                                                    <Download className="mr-2 w-4 h-4" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStar('file', file.id)}>
                                                    <Star className="mr-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    Unstar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setShareTarget({ type: 'file', id: file.id, name: file.name })}>
                                                    <Share2 className="mr-2 w-4 h-4" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 w-4 h-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent className="max-w-none! gap-0! p-0! w-[95vw] h-[95vh] flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b shrink-0">
                        <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex overflow-auto flex-1 justify-center items-center bg-black/5">
                        {previewLoading ? (
                            <p className="text-muted-foreground">Loading...</p>
                        ) : previewUrl ? (
                            isImage(previewFile?.mime_type ?? '') ? (
                                <img
                                    src={previewUrl}
                                    alt={previewFile?.name}
                                    className="object-contain max-w-full max-h-full"
                                />
                            ) : isVideo(previewFile?.mime_type ?? '') ? (
                                <video
                                    src={previewUrl}
                                    controls
                                    autoPlay
                                    className="object-contain max-w-full max-h-full"
                                >
                                    Your browser does not support video playback.
                                </video>
                            ) : isAudio(previewFile?.mime_type ?? '') ? (
                                <div className="flex flex-col gap-4 items-center p-8 w-full max-w-md">
                                    <FileAudio className="w-24 h-24 text-green-500" />
                                    <p className="text-sm text-muted-foreground">{previewFile?.name}</p>
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

            {/* Share Dialog */}
            {shareTarget && (
                <ShareDialog
                    open={!!shareTarget}
                    onOpenChange={(open) => !open && setShareTarget(null)}
                    resourceType={shareTarget.type}
                    resourceId={shareTarget.id}
                    resourceName={shareTarget.name}
                />
            )}
        </AuthenticatedLayout>
    );
}
