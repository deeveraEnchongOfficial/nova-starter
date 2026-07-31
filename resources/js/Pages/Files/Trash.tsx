import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Folder as FolderIcon, File as FileIcon, Trash2, RotateCcw, Home } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';

interface TrashedFolder {
    id: string;
    name: string;
    deleted_at: string;
}

interface TrashedFile {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    deleted_at: string;
}

export default function FilesTrash({
    trashedFolders,
    trashedFiles,
}: PageProps<{
    trashedFolders: TrashedFolder[];
    trashedFiles: TrashedFile[];
}>) {
    const [emptying, setEmptying] = useState(false);

    const handleRestoreFolder = useCallback(async (id: string) => {
        await axios.post(`/api/v1/folders/${id}/restore`);
        router.reload({ only: ['trashedFolders', 'trashedFiles'] });
    }, []);

    const handleRestoreFile = useCallback(async (id: string) => {
        await axios.post(`/api/v1/files/${id}/restore`);
        router.reload({ only: ['trashedFolders', 'trashedFiles'] });
    }, []);

    const handleEmptyTrash = useCallback(async () => {
        if (!confirm('Permanently delete all items in trash? This cannot be undone.')) return;
        setEmptying(true);
        try {
            await axios.delete('/api/v1/trash');
            router.reload({ only: ['trashedFolders', 'trashedFiles'] });
        } finally {
            setEmptying(false);
        }
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalItems = trashedFolders.length + trashedFiles.length;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Trash</h2>}>
            <Head title="Trash" />

            <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('files.index')}>
                            <Button variant="ghost" size="sm"><Home className="mr-1 h-4 w-4" /> My Files</Button>
                        </Link>
                    </div>
                    {totalItems > 0 && (
                        <Button onClick={handleEmptyTrash} variant="destructive" size="sm" disabled={emptying}>
                            <Trash2 className="mr-1 h-4 w-4" /> Empty Trash
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-auto">
                    {totalItems === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Trash2 className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                <p>Trash is empty</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Size</th>
                                    <th className="p-2">Deleted</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {trashedFolders.map((folder) => (
                                    <tr key={folder.id} className="border-b hover:bg-accent">
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <FolderIcon className="h-5 w-5 text-yellow-500" />
                                                <span>{folder.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-sm text-muted-foreground">—</td>
                                        <td className="p-2 text-sm text-muted-foreground">{folder.deleted_at}</td>
                                        <td className="p-2">
                                            <Button onClick={() => handleRestoreFolder(folder.id)} variant="ghost" size="sm">
                                                <RotateCcw className="mr-1 h-4 w-4" /> Restore
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {trashedFiles.map((file) => (
                                    <tr key={file.id} className="border-b hover:bg-accent">
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-5 w-5 text-gray-500" />
                                                <span>{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-sm text-muted-foreground">{formatSize(file.size)}</td>
                                        <td className="p-2 text-sm text-muted-foreground">{file.deleted_at}</td>
                                        <td className="p-2">
                                            <Button onClick={() => handleRestoreFile(file.id)} variant="ghost" size="sm">
                                                <RotateCcw className="mr-1 h-4 w-4" /> Restore
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
