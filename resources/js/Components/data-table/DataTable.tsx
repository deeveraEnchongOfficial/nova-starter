import { useMemo, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { DataTableColumnHeader } from './DataTableColumnHeader';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import type { Column, DataTableProps, PaginatedData, SortDirection } from './types';

function isPaginated<T>(data: T[] | PaginatedData<T>): data is PaginatedData<T> {
    return !Array.isArray(data);
}

export function DataTable<T>({
    columns,
    data,
    rowKey,
    searchable = false,
    searchPlaceholder = 'Search...',
    searchValue: externalSearchValue,
    onSearchChange,
    onSearchSubmit,
    toolbar,
    emptyMessage = 'No results found.',
    serverSide = false,
    perPage,
    perPageOptions,
    onPerPageChange,
}: DataTableProps<T>) {
    const [internalSearch, setInternalSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const searchValue = externalSearchValue ?? internalSearch;
    const handleSearchChange = onSearchChange ?? setInternalSearch;

    const paginated = isPaginated(data);
    const rows = paginated ? data.data : data;

    const processedRows = useMemo(() => {
        let result = [...rows];

        if (!serverSide && searchValue) {
            const lower = searchValue.toLowerCase();
            result = result.filter((row) =>
                columns.some((col) => {
                    const accessor = col.sortAccessor;
                    if (!accessor) return false;
                    return String(accessor(row)).toLowerCase().includes(lower);
                }),
            );
        }

        if (!serverSide && sortKey && sortDirection) {
            const col = columns.find((c) => c.key === sortKey);
            if (col?.sortAccessor) {
                result.sort((a, b) => {
                    const aVal = col.sortAccessor!(a);
                    const bVal = col.sortAccessor!(b);
                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        }

        return result;
    }, [rows, columns, searchValue, sortKey, sortDirection, serverSide]);

    const handleSort = (col: Column<T>) => {
        if (!col.sortable) return;
        if (sortKey === col.key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
            if (sortDirection === 'desc') {
                setSortKey(null);
            }
        } else {
            setSortKey(col.key);
            setSortDirection('asc');
        }
    };

    const hasToolbar = searchable || toolbar;

    return (
        <Card>
            {hasToolbar && (
                <CardContent className="border-b px-4 py-4 sm:px-6">
                    <DataTableToolbar
                        searchable={searchable}
                        searchPlaceholder={searchPlaceholder}
                        searchValue={searchValue}
                        onSearchChange={handleSearchChange}
                        onSearchSubmit={onSearchSubmit}
                        toolbar={toolbar}
                    />
                </CardContent>
            )}
            <CardContent className="px-2 sm:px-4 md:px-6">
                <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <DataTableColumnHeader
                                    key={col.key}
                                    sortable={col.sortable}
                                    sortDirection={sortKey === col.key ? sortDirection : null}
                                    onSort={() => handleSort(col)}
                                    className={col.headerClassName}
                                    align={col.align}
                                >
                                    {col.header}
                                </DataTableColumnHeader>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            processedRows.map((row) => (
                                <TableRow key={rowKey(row)}>
                                    {columns.map((col) => (
                                        <TableCell
                                            key={col.key}
                                            className={col.className}
                                        >
                                            {col.cell(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
            {paginated && (
                <CardContent className="border-t px-0">
                    <DataTablePagination
                        from={data.from}
                        to={data.to}
                        total={data.total}
                        links={data.links}
                        perPage={perPage ?? data.per_page}
                        perPageOptions={perPageOptions}
                        onPerPageChange={onPerPageChange}
                    />
                </CardContent>
            )}
        </Card>
    );
}
