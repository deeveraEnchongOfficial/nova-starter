import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { File as FileIcon, Download } from 'lucide-react';
import { useCallback } from 'react';
import type { PageProps } from '@/types';
import axios from 'axios';
import FilesTabs from '@/Components/FilesTabs';

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
}: PageProps<{
    sharedFiles: SharedFile[];
}>) {
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
        if (mimeType.startsWith('image/')) return <FileIcon className="h-5 w-5 text-blue-500" />;
        if (mimeType.startsWith('video/')) return <FileIcon className="h-5 w-5 text-purple-500" />;
        if (mimeType.includes('pdf')) return <FileIcon className="h-5 w-5 text-red-500" />;
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-foreground">Shared with me</h2>}>
            <Head title="Shared" />

            <div className="flex h-full flex-col gap-4">
                <FilesTabs active="shared" />

                <div className="flex-1 overflow-auto">
                    {sharedFiles.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <FileIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                <p>No shared files</p>
                                <p className="text-sm">Files shared with you will appear here</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Size</th>
                                    <th className="p-2">Shared date</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sharedFiles.map((file) => (
                                    <tr key={file.id} className="border-b hover:bg-accent">
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                {getFileIcon(file.mime_type)}
                                                <span>{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-sm text-muted-foreground">{formatSize(file.size)}</td>
                                        <td className="p-2 text-sm text-muted-foreground">{file.created_at}</td>
                                        <td className="p-2">
                                            <Button onClick={() => handleDownload(file.id)} variant="ghost" size="sm">
                                                <Download className="mr-1 h-4 w-4" /> Download
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
