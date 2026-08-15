import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
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
    Download,
    MoreVertical,
    Eye,
    Play,
    Users,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';
import FilesTabs from '@/Components/FilesTabs';
import ImageThumbnail from '@/Components/ImageThumbnail';
import { useAudioPlayer, type AudioTrack } from '@/contexts/AudioPlayerContext';
import FilePreviewDialog from '@/Components/FilePreviewDialog';

interface SharedFolder {
    id: string;
    name: string;
    color: string | null;
    created_at: string;
}

interface SharedFile {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    url: string;
    created_at: string;
}

export default function FilesShared({
    sharedFiles,
    sharedFolders,
}: PageProps<{
    sharedFiles: SharedFile[];
    sharedFolders: SharedFolder[];
}>) {
    const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
    const { play: playAudio } = useAudioPlayer();

    const handlePlayAudio = useCallback((file: SharedFile) => {
        const audioFiles = sharedFiles.filter((f) => f.mime_type.startsWith('audio/'));
        const track: AudioTrack = { id: file.id, name: file.name, mime_type: file.mime_type, size: file.size };
        const playlist: AudioTrack[] = audioFiles.map((f) => ({
            id: f.id, name: f.name, mime_type: f.mime_type, size: f.size,
        }));
        playAudio(track, playlist);
    }, [sharedFiles, playAudio]);

    const handleDownload = useCallback(async (id: string) => {
        const response = await axios.get(`/api/v1/files/${id}/download`);
        window.open(response.data.url, '_blank');
    }, []);

    const isPreviewable = (mimeType: string) => {
        return mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/');
    };

    const handlePreview = useCallback((file: SharedFile) => {
        setPreviewFile(file);
    }, []);

    // Build the list of image files for prev/next navigation
    const imageFiles = useMemo(
        () => sharedFiles.filter((f) => f.mime_type.startsWith('image/')),
        [sharedFiles],
    );

    const currentImageIndex = useMemo(
        () => (previewFile ? imageFiles.findIndex((f) => f.id === previewFile.id) : -1),
        [previewFile, imageFiles],
    );

    const handlePrevImage = useCallback(() => {
        if (currentImageIndex > 0) {
            setPreviewFile(imageFiles[currentImageIndex - 1]);
        }
    }, [currentImageIndex, imageFiles]);

    const handleNextImage = useCallback(() => {
        if (currentImageIndex >= 0 && currentImageIndex < imageFiles.length - 1) {
            setPreviewFile(imageFiles[currentImageIndex + 1]);
        }
    }, [currentImageIndex, imageFiles]);

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

    const getFileDisplay = (file: SharedFile) => {
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

    const totalItems = sharedFolders.length + sharedFiles.length;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Shared with me</h2>}>
            <Head title="Shared" />

            <div className="flex flex-col gap-4 h-full">
                <FilesTabs active="shared" />

                <div className="overflow-auto flex-1">
                    {totalItems === 0 ? (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                            <div className="text-center">
                                <Users className="mx-auto mb-2 w-12 h-12 opacity-50" />
                                <p>No shared items</p>
                                <p className="text-sm">Files and folders shared with you will appear here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {sharedFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="flex relative flex-col items-center p-4 rounded-lg border cursor-pointer group hover:bg-accent"
                                    onDoubleClick={() => router.visit(route('files.index', { folder_id: folder.id }))}
                                >
                                    <FolderIcon className={`h-12 w-12 ${folderColorClass(folder.color)}`} />
                                    <p className="mt-2 w-full text-sm font-medium text-center truncate">{folder.name}</p>
                                    <p className="text-xs text-muted-foreground">Folder</p>
                                    <div className="flex absolute top-1 right-1 items-center opacity-100 md:opacity-0 md:group-hover:opacity-100">
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
                                                <DropdownMenuItem onClick={() => router.visit(route('files.index', { folder_id: folder.id }))}>
                                                    <Eye className="mr-2 w-4 h-4" />
                                                    Open
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                            {sharedFiles.map((file) => (
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
            <FilePreviewDialog
                file={previewFile}
                onClose={() => setPreviewFile(null)}
                onPrev={currentImageIndex > 0 ? handlePrevImage : undefined}
                onNext={currentImageIndex >= 0 && currentImageIndex < imageFiles.length - 1 ? handleNextImage : undefined}
            />
        </AuthenticatedLayout>
    );
}
