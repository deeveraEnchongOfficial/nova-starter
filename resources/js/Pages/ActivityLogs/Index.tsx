import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { DataTable, type Column, type PaginatedData } from '@/Components/data-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface ActivityRow {
    id: string;
    type: string;
    description: string;
    route: string | null;
    method: string | null;
    ip_address: string | null;
    created_at: string;
    created_by: { id: string; name: string; email: string } | null;
    subject_type: string | null;
    subject_id: string | null;
}

interface ActivityType {
    value: string;
    label: string;
}

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    create: 'default',
    update: 'secondary',
    delete: 'destructive',
    login: 'outline',
    logout: 'outline',
    register: 'default',
    export: 'secondary',
    download: 'outline',
    share: 'secondary',
    restore: 'default',
    upload: 'default',
};

export default function ActivityLogsIndex({
    activities,
    filters,
    types,
}: PageProps<{
    activities: PaginatedData<ActivityRow>;
    filters: { search?: string; per_page?: number; type?: string };
    types: ActivityType[];
}>) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [clearing, setClearing] = useState(false);

    const handleSearch = (value: string) => {
        router.get(route('activity-logs.index'), { search: value, type: typeFilter !== 'all' ? typeFilter : undefined }, { preserveState: true });
    };

    const handleTypeChange = (value: string) => {
        setTypeFilter(value);
        router.get(route('activity-logs.index'), { search, type: value !== 'all' ? value : undefined }, { preserveState: true });
    };

    const handleClearLogs = () => {
        setClearing(true);
        router.delete(route('activity-logs.clear'), {
            preserveState: false,
            onFinish: () => {
                setClearing(false);
                setShowClearDialog(false);
            },
        });
    };

    const columns: Column<ActivityRow>[] = [
        {
            key: 'created_at',
            header: 'Date',
            sortable: true,
            sortAccessor: (row) => row.created_at,
            cell: (row) => (
                <span className="text-muted-foreground text-sm">
                    {new Date(row.created_at).toLocaleString()}
                </span>
            ),
        },
        {
            key: 'type',
            header: 'Action',
            cell: (row) => (
                <Badge variant={typeBadgeVariant[row.type] ?? 'outline'}>
                    {row.type}
                </Badge>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            cell: (row) => <span className="font-medium">{row.description}</span>,
        },
        {
            key: 'created_by',
            header: 'User',
            cell: (row) => (
                <span className="text-sm">
                    {row.created_by?.name ?? 'System'}
                </span>
            ),
        },
        {
            key: 'ip_address',
            header: 'IP Address',
            cell: (row) => (
                <span className="text-muted-foreground text-sm font-mono">
                    {row.ip_address ?? '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            headerClassName: 'text-right',
            cell: (row) => (
                <div className="flex justify-end">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={route('activity-logs.show', row.id)}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Activity Logs</h1>}
        >
            <Head title="Activity Logs" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
                    <p className="text-muted-foreground">Track user actions and system events across the application.</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Select value={typeFilter} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-45">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {types.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowClearDialog(true)}
                        disabled={activities.data.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Logs
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={activities}
                    rowKey={(row) => row.id}
                    searchable
                    searchPlaceholder="Search activity logs..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    onSearchSubmit={handleSearch}
                    serverSide
                    perPage={activities.per_page}
                    onPerPageChange={(value) => {
                        router.get(route('activity-logs.index'), { search, type: typeFilter !== 'all' ? typeFilter : undefined, per_page: value }, { preserveState: true });
                    }}
                    emptyMessage="No activity logs found."
                />
            </div>

            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Clear all activity logs</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all activity log entries. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={clearing}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleClearLogs} disabled={clearing}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {clearing ? 'Clearing...' : 'Clear all logs'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
