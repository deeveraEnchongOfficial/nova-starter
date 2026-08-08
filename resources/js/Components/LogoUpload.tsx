import { useCallback, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

interface LogoUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function LogoUpload({
    value,
    onChange,
    label = 'Logo',
}: LogoUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo must be 2MB or smaller.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await axios.post('/api/v1/settings/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onChange(response.data.url);
            toast.success('Logo uploaded successfully.');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to upload logo.';
            toast.error(message);
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                    {value ? (
                        <img src={value} alt="Logo" className="size-full object-contain" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                </div>

                {/* Upload area + actions */}
                <div className="flex-1 space-y-2">
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={cn(
                            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
                            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-muted-foreground/50',
                        )}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, SVG, WebP (max 2MB)</p>
                            </>
                        )}
                    </div>

                    {value && (
                        <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={uploading}>
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove logo
                        </Button>
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
}
