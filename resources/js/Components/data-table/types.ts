import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    links: PaginationLink[];
}

export interface Column<T> {
    key: string;
    header: ReactNode;
    cell: (row: T) => ReactNode;
    sortable?: boolean;
    sortAccessor?: (row: T) => string | number;
    className?: string;
    headerClassName?: string;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[] | PaginatedData<T>;
    rowKey: (row: T) => string;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: (value: string) => void;
    toolbar?: ReactNode;
    emptyMessage?: string;
    serverSide?: boolean;
    perPage?: number;
    perPageOptions?: number[];
    onPerPageChange?: (perPage: number) => void;
}
