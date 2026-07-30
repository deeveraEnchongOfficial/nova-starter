import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps {
    searchable?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: (value: string) => void;
    toolbar?: ReactNode;
    className?: string;
}

export function DataTableToolbar({
    searchable,
    searchPlaceholder = 'Search...',
    searchValue = '',
    onSearchChange,
    onSearchSubmit,
    toolbar,
    className,
}: DataTableToolbarProps) {
    if (!searchable && !toolbar) {
        return null;
    }

    return (
        <div className={cn('flex items-center justify-between gap-2', className)}>
            {searchable && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSearchSubmit?.(searchValue);
                    }}
                    className="flex items-center gap-2"
                >
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-8"
                        />
                    </div>
                    {onSearchSubmit && (
                        <Button type="submit" variant="secondary" size="sm">
                            Search
                        </Button>
                    )}
                </form>
            )}

            {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
    );
}
