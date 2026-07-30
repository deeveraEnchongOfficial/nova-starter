import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { SortDirection } from './types';
import { TableHead } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps {
    children: React.ReactNode;
    sortable?: boolean;
    sortDirection: SortDirection;
    onSort: () => void;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function DataTableColumnHeader({
    children,
    sortable,
    sortDirection,
    onSort,
    className,
    align = 'left',
}: DataTableColumnHeaderProps) {
    if (!sortable) {
        return (
            <TableHead className={cn(align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>
                {children}
            </TableHead>
        );
    }

    const Icon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown;

    return (
        <TableHead className={cn(align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>
            <Button
                variant="ghost"
                size="sm"
                onClick={onSort}
                className={cn(
                    'h-8 data-[state=open]:bg-accent',
                    align === 'right' && 'ml-auto',
                    align === 'center' && 'mx-auto',
                )}
            >
                <span>{children}</span>
                <Icon className="h-3.5 w-3.5 opacity-50" />
            </Button>
        </TableHead>
    );
}
