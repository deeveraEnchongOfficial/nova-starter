import {
    FileArchive,
    FileAudio,
    FileCode,
    FileIcon,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
} from 'lucide-react';
import type { JSX } from 'react';

/**
 * Format bytes into a human-readable string.
 */
export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Map a folder color name to a Tailwind text color class.
 */
export function folderColorClass(color: string | null): string {
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
}

/**
 * Return a Lucide icon element for a given MIME type / file name.
 */
export function getFileIcon(mimeType: string, name?: string): JSX.Element {
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
}
