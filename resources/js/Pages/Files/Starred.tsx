import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Folder as FolderIcon, File as FileIcon, Star, Home, Download } from 'lucide-react';
import { useCallback } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';

interface StarredFolder {
    id: string;
    name: string;
    is_starred: boolean;
}

interface StarredFile {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    is_starred: boolean;
    url: string;
}

export default function FilesStarred({
    starredFolders,
    starredFiles,
}: PageProps<{
    starredFolders: StarredFolder[];
    starredFiles: StarredFile[];
}>) {
    const handleToggleStar = useCallback(async (type: 'file' | 'folder', id: string) => {
        const endpoint = type === 'file' ? `/api/v1/files/${id}/star` : `/api/v1/folders/${id}/star`;
        await axios.post(endpoint);
        router.reload({ only: ['starredFolders', 'starredFiles'] });
    }, []);

    const handleDownload = useCallback(async (id: string) => {
        const response = await axios.get(`/api/v1/files/${id}/download`);
        window.open(response.data.url, '_blank');
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <FileIcon className="h-8 w-8 text-blue-500" />;
        if (mimeType.startsWith('video/')) return <FileIcon className="h-8 w-8 text-purple-500" />;
        if (mimeType.includes('pdf')) return <FileIcon className="h-8 w-8 text-red-500" />;
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    };

    const totalItems = starredFolders.length + starredFiles.length;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Starred</h2>}>
            <Head title="Starred" />

            <div className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Link href={route('files.index')}>
                        <Button variant="ghost" size="sm"><Home className="mr-1 h-4 w-4" /> My Files</Button>
                    </Link>
                </div>

                <div className="flex-1 overflow-auto">
                    {totalItems === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Star className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                <p>No starred items</p>
                                <p className="text-sm">Star files and folders to find them quickly here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {starredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="group relative flex cursor-pointer flex-col items-center rounded-lg border p-4 hover:bg-accent"
                                    onDoubleClick={() => router.visit(route('files.index', { folder_id: folder.id }))}
                                >
                                    <FolderIcon className="h-12 w-12 text-yellow-500" />
                                    <p className="mt-2 w-full truncate text-center text-sm font-medium">{folder.name}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStar('folder', folder.id);
                                        }}
                                        className="absolute right-1 top-1 rounded p-1 hover:bg-accent-foreground/10"
                                    >
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    </button>
                                </div>
                            ))}
                            {starredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="group relative flex cursor-pointer flex-col items-center rounded-lg border p-4 hover:bg-accent"
                                >
                                    {getFileIcon(file.mime_type)}
                                    <p className="mt-2 w-full truncate text-center text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                                    <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(file.id);
                                            }}
                                            className="rounded p-1 hover:bg-accent-foreground/10"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar('file', file.id);
                                            }}
                                            className="rounded p-1 hover:bg-accent-foreground/10"
                                        >
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
