import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import ImageThumbnail from '@/Components/ImageThumbnail';
import FilesTabs from '@/Components/FilesTabs';
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
    DialogDescription,
    DialogFooter,
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
    Upload,
    FolderPlus,
    Star,
    Trash2,
    Download,
    MoreVertical,
    ChevronRight,
    Home,
    Search,
    Eye,
    Info,
    Palette,
    Pencil,
    Play,
    Share2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';
import FilePreviewDialog from '@/Components/FilePreviewDialog';
import { useAudioPlayer, type AudioTrack } from '@/contexts/AudioPlayerContext';
import ShareDialog from '@/Components/ShareDialog';

interface FolderItem {
    id: string;
    name: string;
    parent_id: string | null;
    is_starred: boolean;
    color: string | null;
    created_at: string;
}

interface FileItem {
    id: string;
    name: string;
    path: string;
    disk: string;
    size: number;
    mime_type: string;
    folder_id: string | null;
    is_starred: boolean;
    url: string;
    created_at: string;
}

interface BreadcrumbItem {
    0: string; // id
    1: string; // name
}

export default function FilesIndex({
    folders,
    files,
    currentFolderId,
    breadcrumbs,
}: PageProps<{
    folders: FolderItem[];
    files: FileItem[];
    currentFolderId: string | null;
    breadcrumbs: BreadcrumbItem[];
}>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ files: FileItem[]; folders: FolderItem[] } | null>(null);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [uploads, setUploads] = useState<{ id: string; name: string; progress: number; status: 'uploading' | 'done' | 'error'; error?: string }[]>([]);    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [detailsFile, setDetailsFile] = useState<FileItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
    const [colorTarget, setColorTarget] = useState<FolderItem | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [renameTarget, setRenameTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [shareTarget, setShareTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
    const { play: playAudio } = useAudioPlayer();

    const handlePlayAudio = useCallback((file: FileItem) => {
        const audioFiles = files.filter((f) => f.mime_type.startsWith('audio/'));
        const track: AudioTrack = { id: file.id, name: file.name, mime_type: file.mime_type, size: file.size };
        const playlist: AudioTrack[] = audioFiles.map((f) => ({
            id: f.id, name: f.name, mime_type: f.mime_type, size: f.size,
        }));
        playAudio(track, playlist);
    }, [files, playAudio]);

    const handleSearch = useCallback(async (value: string) => {
        setSearchQuery(value);
        if (value.trim().length > 0) {
            const response = await axios.get('/api/v1/search', { params: { q: value, folder_id: currentFolderId } });
            setSearchResults(response.data);
        } else {
            setSearchResults(null);
        }
    }, [currentFolderId]);

    const handleCreateFolder = useCallback(async () => {
        if (!newFolderName.trim()) return;
        await axios.post('/api/v1/folders', {
            name: newFolderName,
            parent_id: currentFolderId,
        });
        setNewFolderName('');
        setShowNewFolderDialog(false);
        router.reload({ only: ['folders', 'files'] });
    }, [newFolderName, currentFolderId]);

    const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024; // 1GB — matches backend default

    const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        const fileArray = Array.from(selectedFiles);
        let remaining = fileArray.length;

        const reloadWhenDone = () => {
            remaining -= 1;
            if (remaining <= 0) {
                router.reload({ only: ['folders', 'files'] });
            }
        };

        fileArray.forEach(async (file) => {
            const uploadId = `${file.name}-${Date.now()}`;

            if (file.size > MAX_UPLOAD_SIZE) {
                setUploads((prev) => [...prev, {
                    id: uploadId,
                    name: file.name,
                    progress: 0,
                    status: 'error' as const,
                    error: 'File too large (max 1GB)',
                }]);
                remaining -= 1;
                return;
            }

            setUploads((prev) => [...prev, { id: uploadId, name: file.name, progress: 0, status: 'uploading' }]);

            try {
                const initiateResponse = await axios.post('/api/v1/files/initiate', {
                    content_type: file.type || 'application/octet-stream',
                    content_size: file.size,
                    purpose: 'default',
                });

                const headers = { ...initiateResponse.data.headers };
                delete headers['Host'];

                await axios.put(initiateResponse.data.url, file, {
                    headers,
                    onUploadProgress: (progressEvent) => {
                        const percent = progressEvent.total
                            ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
                            : 0;
                        setUploads((prev) =>
                            prev.map((u) => (u.id === uploadId ? { ...u, progress: percent } : u)),
                        );
                    },
                });

                await axios.post('/api/v1/files/confirm', {
                    purpose: 'default',
                    key: initiateResponse.data.key,
                    name: file.name,
                    folder_id: currentFolderId,
                });

                setUploads((prev) =>
                    prev.map((u) => (u.id === uploadId ? { ...u, status: 'done', progress: 100 } : u)),
                );
            } catch (error: any) {
                console.error('Upload failed:', error);
                const errorMsg = error?.response?.data?.message
                    || error?.message
                    || 'Upload failed';
                setUploads((prev) =>
                    prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: errorMsg } : u)),
                );
            } finally {
                reloadWhenDone();
            }
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [currentFolderId]);

    const handleDeleteFile = useCallback((id: string, name: string) => {
        setDeleteTarget({ type: 'file', id, name });
    }, []);

    const handleDeleteFolder = useCallback((id: string, name: string) => {
        setDeleteTarget({ type: 'folder', id, name });
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        const endpoint = deleteTarget.type === 'file'
            ? `/api/v1/files/${deleteTarget.id}`
            : `/api/v1/folders/${deleteTarget.id}`;
        await axios.delete(endpoint);
        setDeleteTarget(null);
        router.reload({ only: ['folders', 'files'] });
    }, [deleteTarget]);

    const handleRename = useCallback((type: 'file' | 'folder', id: string, name: string) => {
        setRenameTarget({ type, id, name });
        setRenameValue(name);
    }, []);

    const confirmRename = useCallback(async () => {
        if (!renameTarget || !renameValue.trim()) return;
        const endpoint = renameTarget.type === 'file'
            ? `/api/v1/files/${renameTarget.id}`
            : `/api/v1/folders/${renameTarget.id}`;
        await axios.patch(endpoint, { name: renameValue.trim() });
        setRenameTarget(null);
        router.reload({ only: ['folders', 'files'] });
    }, [renameTarget, renameValue]);

    const handleColorChange = useCallback((folder: FolderItem) => {
        setColorTarget(folder);
        setSelectedColor(folder.color);
    }, []);

    const confirmColorChange = useCallback(async () => {
        if (!colorTarget) return;
        await axios.patch(`/api/v1/folders/${colorTarget.id}`, { color: selectedColor });
        setColorTarget(null);
        router.reload({ only: ['folders', 'files'] });
    }, [colorTarget, selectedColor]);

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

    const handleToggleStar = useCallback(async (type: 'file' | 'folder', id: string) => {
        const endpoint = type === 'file' ? `/api/v1/files/${id}/star` : `/api/v1/folders/${id}/star`;
        await axios.post(endpoint);
        router.reload({ only: ['folders', 'files'] });
    }, []);

    const handleDownload = useCallback(async (id: string) => {
        const response = await axios.get(`/api/v1/files/${id}/download`);
        window.open(response.data.url, '_blank');
    }, []);

    const isPreviewable = (mimeType: string) => {
        return mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/');
    };

    const handlePreview = useCallback((file: FileItem) => {
        setPreviewFile(file);
    }, []);

    // Build the list of image files for prev/next navigation
    const imageFiles = useMemo(
        () => files.filter((f) => f.mime_type.startsWith('image/')),
        [files],
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

    const getFileDisplay = (file: FileItem, size: 'small' | 'large' = 'small') => {
        if (file.mime_type.startsWith('image/')) {
            const sizeClass = size === 'large' ? 'w-12 h-12' : 'w-8 h-8';
            return <ImageThumbnail src={file.url} alt={file.name} className={sizeClass} />;
        }
        return size === 'large' ?
            <div className="flex justify-center items-center w-12 h-12">{getFileIcon(file.mime_type, file.name)}</div> :
            getFileIcon(file.mime_type, file.name);
    };

    const displayFolders = searchResults?.folders ?? folders;
    const displayFiles = searchResults?.files ?? files;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Files</h2>}>
            <Head title="Files" />

            <div className="flex flex-col gap-4 h-full">
                {/* Tabs */}
                <FilesTabs active="index" />

                {/* Toolbar */}
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search files and folders..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={() => setShowNewFolderDialog(true)} variant="outline" size="sm">
                        <FolderPlus className="mr-1 w-4 h-4" /> New Folder
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} size="sm">
                        <Upload className="mr-1 w-4 h-4" /> Upload
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                    />
                </div>

                {/* Upload progress */}
                {uploads.length > 0 && (
                    <div className="p-3 rounded-lg border bg-card">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                                {uploads.filter((u) => u.status === 'uploading').length > 0
                                    ? `Uploading ${uploads.filter((u) => u.status === 'uploading').length} file(s)...`
                                    : 'Uploads complete'}
                            </span>
                            {uploads.every((u) => u.status !== 'uploading') && (
                                <button
                                    onClick={() => setUploads([])}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {uploads.map((upload) => (
                                <div key={upload.id} className="flex gap-3 items-center">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="truncate text-foreground">{upload.name}</span>
                                            <span className={
                                                upload.status === 'error'
                                                    ? 'ml-2 shrink-0 text-red-500'
                                                    : upload.status === 'done'
                                                        ? 'ml-2 shrink-0 text-green-500'
                                                        : 'ml-2 shrink-0 text-muted-foreground'
                                            }>
                                                {upload.status === 'error'
                                                    ? (upload.error || 'Failed')
                                                    : upload.status === 'done'
                                                        ? 'Done'
                                                        : `${upload.progress}%`}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={
                                                    'h-full rounded-full transition-all ' +
                                                    (upload.status === 'error'
                                                        ? 'bg-red-500'
                                                        : upload.status === 'done'
                                                            ? 'bg-green-500'
                                                            : 'bg-primary')
                                                }
                                                style={{ width: `${upload.status === 'done' ? 100 : upload.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
                    <div className="flex gap-1 items-center text-sm text-muted-foreground">
                        <Link href={route('files.index')}>
                            <Home className="w-4 h-4" />
                        </Link>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb[0]} className="flex gap-1 items-center">
                                <ChevronRight className="w-3 h-3" />
                                <Link
                                    href={route('files.index', { folder_id: crumb[0] })}
                                    className={index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'hover:text-foreground'}
                                >
                                    {crumb[1]}
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* New folder dialog */}
                {showNewFolderDialog && (
                    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
                        <div className="p-6 rounded-lg shadow-lg bg-background">
                            <h3 className="mb-4 text-lg font-medium">New Folder</h3>
                            <Input
                                placeholder="Folder name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end mt-4">
                                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
                                <Button onClick={handleCreateFolder}>Create</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content area */}
                <div className="overflow-auto flex-1">
                    {displayFolders.length === 0 && displayFiles.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                            <div className="text-center">
                                <FolderIcon className="mx-auto mb-2 w-12 h-12 opacity-50" />
                                <p>No files or folders yet</p>
                                <p className="text-sm">Upload a file or create a folder to get started</p>
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {displayFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="flex relative flex-col items-center p-4 w-full rounded-lg border cursor-pointer group hover:bg-accent"
                                    onDoubleClick={() => router.visit(route('files.index', { folder_id: folder.id }))}
                                >
                                    <FolderIcon className={`w-12 h-12 shrink-0 ${folderColorClass(folder.color)}`} />
                                    <p className="mt-2 w-full text-sm font-medium text-center truncate">{folder.name}</p>
                                    <div className="flex absolute top-1 right-1 items-center opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar('folder', folder.id);
                                            }}
                                            className="p-1 rounded hover:bg-accent-foreground/10"
                                        >
                                            <Star className={`h-4 w-4 ${folder.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
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
                                                <DropdownMenuItem onClick={() => handleRename('folder', folder.id, folder.name)}>
                                                    <Pencil className="mr-2 w-4 h-4" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleColorChange(folder)}>
                                                    <Palette className="mr-2 w-4 h-4" />
                                                    Change Color
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStar('folder', folder.id)}>
                                                    <Star className={`mr-2 h-4 w-4 ${folder.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                    {folder.is_starred ? 'Unstar' : 'Star'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setShareTarget({ type: 'folder', id: folder.id, name: folder.name })}>
                                                    <Share2 className="mr-2 w-4 h-4" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
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
                            {displayFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex relative flex-col items-center p-4 w-full rounded-lg border cursor-pointer group hover:bg-accent"
                                    onDoubleClick={() => isPreviewable(file.mime_type) ? handlePreview(file) : handleDownload(file.id)}
                                >
                                    <div className="flex justify-center items-center shrink-0 relative">
                                        {getFileDisplay(file, 'large')}
                                        {file.mime_type.startsWith('audio/') && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePlayAudio(file); }}
                                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                                            >
                                                <Play className="w-6 h-6 text-white fill-white" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-2 w-full text-sm font-medium text-center truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                                    <div className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar('file', file.id);
                                            }}
                                            className="p-1 rounded hover:bg-accent-foreground/10"
                                        >
                                            <Star className={`h-4 w-4 ${file.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
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
                                                <DropdownMenuItem onClick={() => handleRename('file', file.id, file.name)}>
                                                    <Pencil className="mr-2 w-4 h-4" />
                                                    Rename
                                                </DropdownMenuItem>
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
                                                    <Star className={`mr-2 h-4 w-4 ${file.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                    {file.is_starred ? 'Unstar' : 'Star'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setShareTarget({ type: 'file', id: file.id, name: file.name })}>
                                                    <Share2 className="mr-2 w-4 h-4" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDetailsFile(file)}>
                                                    <Info className="mr-2 w-4 h-4" />
                                                    Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteFile(file.id, file.name)}
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
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-sm text-left border-b text-muted-foreground">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Size</th>
                                    <th className="p-2">Modified</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayFolders.map((folder) => (
                                    <tr key={folder.id} className="border-b hover:bg-accent">
                                        <td className="p-2">
                                            <div className="flex gap-2 items-center">
                                                <FolderIcon className={`w-5 h-5 ${folderColorClass(folder.color)}`} />
                                                <Link href={route('files.index', { folder_id: folder.id })} className="hover:underline">
                                                    {folder.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="p-2 text-sm text-muted-foreground">—</td>
                                        <td className="p-2 text-sm text-muted-foreground">{folder.created_at}</td>
                                        <td className="p-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1 rounded hover:bg-accent-foreground/10">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleRename('folder', folder.id, folder.name)}>
                                                        <Pencil className="mr-2 w-4 h-4" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleColorChange(folder)}>
                                                        <Palette className="mr-2 w-4 h-4" />
                                                        Change Color
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStar('folder', folder.id)}>
                                                        <Star className={`mr-2 h-4 w-4 ${folder.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                        {folder.is_starred ? 'Unstar' : 'Star'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setShareTarget({ type: 'folder', id: folder.id, name: folder.name })}>
                                                        <Share2 className="mr-2 w-4 h-4" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteFolder(folder.id, folder.name)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 w-4 h-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {displayFiles.map((file) => (
                                    <tr key={file.id} className="border-b hover:bg-accent">
                                        <td className="p-2">
                                            <div
                                                className="flex gap-2 items-center cursor-pointer"
                                                onDoubleClick={() => isPreviewable(file.mime_type) ? handlePreview(file) : handleDownload(file.id)}
                                            >
                                                {getFileDisplay(file, 'small')}
                                                <span>{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-sm text-muted-foreground">{formatSize(file.size)}</td>
                                        <td className="p-2 text-sm text-muted-foreground">{file.created_at}</td>
                                        <td className="p-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1 rounded hover:bg-accent-foreground/10">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleRename('file', file.id, file.name)}>
                                                        <Pencil className="mr-2 w-4 h-4" />
                                                        Rename
                                                    </DropdownMenuItem>
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
                                                        <Star className={`mr-2 h-4 w-4 ${file.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                        {file.is_starred ? 'Unstar' : 'Star'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setShareTarget({ type: 'file', id: file.id, name: file.name })}>
                                                        <Share2 className="mr-2 w-4 h-4" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDetailsFile(file)}>
                                                        <Info className="mr-2 w-4 h-4" />
                                                        Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteFile(file.id, file.name)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 w-4 h-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* File Preview Modal */}
            <FilePreviewDialog
                file={previewFile}
                onClose={() => setPreviewFile(null)}
                onPrev={currentImageIndex > 0 ? handlePrevImage : undefined}
                onNext={currentImageIndex >= 0 && currentImageIndex < imageFiles.length - 1 ? handleNextImage : undefined}
            />

            {/* File Details Dialog */}
            <Dialog open={!!detailsFile} onOpenChange={(open) => !open && setDetailsFile(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>File Details</DialogTitle>
                    </DialogHeader>
                    {detailsFile && (
                        <div className="space-y-3">
                            <div className="flex justify-center items-center py-4">
                                {detailsFile.mime_type.startsWith('image/') ? (
                                    <ImageThumbnail src={detailsFile.url} alt={detailsFile.name} className="w-32 h-32" />
                                ) : (
                                    <div className="flex justify-center items-center w-16 h-16">
                                        {getFileIcon(detailsFile.mime_type, detailsFile.name)}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Name</span>
                                    <span className="ml-4 text-sm font-medium text-right truncate max-w-50">{detailsFile.name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Size</span>
                                    <span className="text-sm font-medium">{formatSize(detailsFile.size)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Type</span>
                                    <span className="text-sm font-medium">{detailsFile.mime_type}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Starred</span>
                                    <span className="text-sm font-medium">{detailsFile.is_starred ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground">Created</span>
                                    <span className="text-sm font-medium">{detailsFile.created_at}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-muted-foreground">Path</span>
                                    <span className="ml-4 font-mono text-xs text-right truncate max-w-50">{detailsFile.path}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                {isPreviewable(detailsFile.mime_type) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            handlePreview(detailsFile);
                                            setDetailsFile(null);
                                        }}
                                    >
                                        <Eye className="mr-1 w-4 h-4" /> Preview
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleDownload(detailsFile.id)}
                                >
                                    <Download className="mr-1 w-4 h-4" /> Download
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Move to trash</DialogTitle>
                        <DialogDescription>
                            {deleteTarget?.type === 'folder'
                                ? `Move "${deleteTarget?.name}" and all its contents to trash? You can restore it later from the trash.`
                                : `Move "${deleteTarget?.name}" to trash? You can restore it later from the trash.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            <Trash2 className="mr-2 w-4 h-4" />
                            Move to trash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Color Picker Dialog */}
            <Dialog open={!!colorTarget} onOpenChange={(open) => !open && setColorTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Folder Color</DialogTitle>
                        <DialogDescription>
                            Choose a color for "{colorTarget?.name}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-3 py-4">
                        {[
                            { name: null, label: 'Default', class: 'text-yellow-500' },
                            { name: 'blue', label: 'Blue', class: 'text-blue-500' },
                            { name: 'green', label: 'Green', class: 'text-green-500' },
                            { name: 'red', label: 'Red', class: 'text-red-500' },
                            { name: 'purple', label: 'Purple', class: 'text-purple-500' },
                            { name: 'orange', label: 'Orange', class: 'text-orange-500' },
                            { name: 'pink', label: 'Pink', class: 'text-pink-500' },
                            { name: 'gray', label: 'Gray', class: 'text-gray-500' },
                        ].map((c) => (
                            <button
                                key={c.label}
                                onClick={() => setSelectedColor(c.name)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors hover:bg-accent ${selectedColor === c.name ? 'ring-2 ring-primary border-primary' : ''}`}
                            >
                                <FolderIcon className={`w-8 h-8 ${c.class}`} />
                                <span className="text-xs">{c.label}</span>
                            </button>
                        ))}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setColorTarget(null)}>Cancel</Button>
                        <Button onClick={confirmColorChange}>
                            <Palette className="mr-2 w-4 h-4" />
                            Apply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Rename {renameTarget?.type}</DialogTitle>
                        <DialogDescription>
                            Enter a new name for "{renameTarget?.name}"
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="New name"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                        autoFocus
                    />
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
                        <Button onClick={confirmRename} disabled={!renameValue.trim()}>
                            <Pencil className="mr-2 w-4 h-4" />
                            Rename
                        </Button>
                    </DialogFooter>
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
