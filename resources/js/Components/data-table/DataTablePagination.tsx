import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationLink } from './types';

interface DataTablePaginationProps {
    from: number;
    to: number;
    total: number;
    links: PaginationLink[];
    perPage?: number;
    perPageOptions?: number[];
    onPerPageChange?: (perPage: number) => void;
}

export function DataTablePagination({
    from,
    to,
    total,
    links,
    perPage,
    perPageOptions = [10, 20, 50, 100],
    onPerPageChange,
}: DataTablePaginationProps) {
    if (total === 0) {
        return (
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                <p className="text-sm text-muted-foreground">No results found.</p>
            </div>
        );
    }

    const navLinks = links.filter((link) => !link.label.includes('&laquo;') && !link.label.includes('&raquo;'));
    const prevLink = links.find((link) => link.label.includes('&laquo; Previous'));
    const nextLink = links.find((link) => link.label.includes('Next &raquo;'));

    return (
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
                {onPerPageChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
                        <Select
                            value={String(perPage ?? 10)}
                            onValueChange={(val) => onPerPageChange(Number(val))}
                        >
                            <SelectTrigger size="sm" className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {perPageOptions.map((opt) => (
                                    <SelectItem key={opt} value={String(opt)}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing {from} to {to} of {total} results
                </p>
            </div>
            <div className="flex items-center gap-1">
                {prevLink && (
                    <Button asChild={!!prevLink.url} variant="outline" size="icon" disabled={!prevLink.url} className="h-8 w-8">
                        {prevLink.url ? (
                            <Link href={prevLink.url} preserveState>
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                )}

                {navLinks.map((link, i) => {
                    const label = link.label === '&hellip;' ? '...' : link.label;
                    return (
                        <Button
                            key={i}
                            asChild={!!link.url}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            className="h-8 min-w-8"
                        >
                            {link.url ? (
                                <Link href={link.url} preserveState>
                                    {label}
                                </Link>
                            ) : (
                                <span>{label}</span>
                            )}
                        </Button>
                    );
                })}

                {nextLink && (
                    <Button asChild={!!nextLink.url} variant="outline" size="icon" disabled={!nextLink.url} className="h-8 w-8">
                        {nextLink.url ? (
                            <Link href={nextLink.url} preserveState>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
