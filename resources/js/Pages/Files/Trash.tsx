import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Folder as FolderIcon, File as FileIcon, Trash2, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';
import FilesTabs from '@/Components/FilesTabs';
import { DataTable, type Column } from '@/Components/data-table';
import { formatSize } from '@/lib/file-utils';

interface TrashedItem {
    id: string;
    name: string;
    size?: number;
    deleted_at: string;
    type: 'file' | 'folder';
    mime_type?: string;
}

export default function FilesTrash({
    trashedFolders,
    trashedFiles,
}: PageProps<{
    trashedFolders: Array<{ id: string; name: string; deleted_at: string }>;
    trashedFiles: Array<{ id: string; name: string; size: number; mime_type: string; deleted_at: string }>;
}>) {
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
        try {
            await axios.delete('/api/v1/trash');
            router.reload({ only: ['trashedFolders', 'trashedFiles'] });
        } catch (error) {
            console.error('Failed to empty trash:', error);
        }
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Combine folders and files into a single array for DataTable
    const trashedItems: TrashedItem[] = [
        ...trashedFolders.map((folder) => ({
            ...folder,
            type: 'folder' as const,
        })),
        ...trashedFiles.map((file) => ({
            ...file,
            type: 'file' as const,
        })),
    ];

    const columns: Column<TrashedItem>[] = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            sortAccessor: (row) => row.name,
            cell: (row) => (
                <div className="flex gap-2 items-center">
                    {row.type === 'folder' ? (
                        <FolderIcon className="w-5 h-5 text-yellow-500 shrink-0" />
                    ) : (
                        <FileIcon className="w-5 h-5 text-gray-500 shrink-0" />
                    )}
                    <span className="font-medium">{row.name}</span>
                </div>
            ),
        },
        {
            key: 'size',
            header: 'Size',
            sortable: true,
            sortAccessor: (row) => row.size ?? 0,
            cell: (row) => (
                <span className="text-sm text-muted-foreground">
                    {row.type === 'folder' ? '—' : formatSize(row.size ?? 0)}
                </span>
            ),
        },
        {
            key: 'deleted_at',
            header: 'Deleted',
            sortable: true,
            sortAccessor: (row) => row.deleted_at,
            cell: (row) => (
                <span className="text-sm text-muted-foreground">
                    {formatDate(row.deleted_at)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            headerClassName: 'text-right',
            cell: (row) => (
                <div className="flex gap-2 justify-end">
                    <Button
                        onClick={() => {
                            if (row.type === 'folder') {
                                handleRestoreFolder(row.id);
                            } else {
                                handleRestoreFile(row.id);
                            }
                        }}
                        variant="ghost"
                        size="sm"
                    >
                        <RotateCcw className="mr-1 w-4 h-4" />
                        Restore
                    </Button>
                </div>
            ),
        },
    ];

    const totalItems = trashedFolders.length + trashedFiles.length;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Trash</h2>}>
            <Head title="Trash" />

            <div className="flex flex-col gap-4 h-full">
                <div className="flex justify-between items-center">
                    <FilesTabs active="trash" />
                    {totalItems > 0 && (
                        <Button onClick={handleEmptyTrash} variant="destructive" size="sm">
                            <Trash2 className="mr-1 w-4 h-4" /> Empty Trash
                        </Button>
                    )}
                </div>

                {totalItems === 0 ? (
                    <div className="flex flex-1 justify-center items-center text-muted-foreground">
                        <div className="text-center">
                            <Trash2 className="mx-auto mb-2 w-12 h-12 opacity-50" />
                            <p>Trash is empty</p>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={trashedItems}
                        rowKey={(row) => row.id}
                        emptyMessage="Trash is empty."
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
