import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { DataTable, type Column, type PaginatedData } from '@/Components/data-table';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import { toast } from 'sonner';

interface UserRow {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name: string;
    email: string;
    created_at: string;
    roles: { id: string; name: string }[];
}

export default function UsersIndex({
    users,
    filters,
}: PageProps<{ users: PaginatedData<UserRow>; filters: { search?: string; per_page?: number } }>) {
    const [search, setSearch] = useState(filters.search || '');
    const { hasPermission } = usePermission();
    const { auth } = usePage<PageProps>().props;
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSearch = (value: string) => {
        router.get(route('users.index'), { search: value }, { preserveState: true });
    };

    const toggleRow = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const currentUserId = auth.user ? String(auth.user.id) : null;

    const toggleAll = (rows: UserRow[]) => {
        setSelectedIds((prev) => {
            const selectableRows = rows.filter((r) => r.id !== currentUserId);
            const allSelected = selectableRows.every((r) => prev.has(r.id));
            if (allSelected) {
                const next = new Set(prev);
                selectableRows.forEach((r) => next.delete(r.id));
                return next;
            }
            const next = new Set(prev);
            selectableRows.forEach((r) => next.add(r.id));
            return next;
        });
    };

    const handleBulkDelete = () => {
        const ids = Array.from(selectedIds);
        const count = ids.length;
        setDeleting(true);
        let successCount = 0;
        let failureCount = 0;
        ids.forEach((id, idx) => {
            router.delete(route('users.destroy', id), {
                preserveScroll: true,
                onSuccess: () => {
                    successCount++;
                    if (idx === count - 1) {
                        setDeleting(false);
                        if (failureCount > 0) {
                            toast.error(`Failed to delete ${failureCount} user${failureCount > 1 ? 's' : ''}.`);
                        }
                        if (successCount > 0) {
                            toast.success(`Deleted ${successCount > 1 ? `${successCount} users` : 'user'} successfully.`);
                        }
                    }
                },
                onError: () => {
                    failureCount++;
                    if (idx === count - 1) {
                        setDeleting(false);
                        if (successCount > 0) {
                            toast.success(`Deleted ${successCount > 1 ? `${successCount} users` : 'user'} successfully.`);
                        }
                        if (failureCount > 0) {
                            toast.error(`Failed to delete ${failureCount} user${failureCount > 1 ? 's' : ''}.`);
                        }
                    }
                },
            });
        });
        setSelectedIds(new Set());
        setShowDeleteDialog(false);
    };

    const canDelete = hasPermission('users.delete');
    const canEdit = hasPermission('users.edit');

    const allRows = users.data;
    const selectableRows = allRows.filter((r) => r.id !== currentUserId);
    const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selectedIds.has(r.id));

    const columns: Column<UserRow>[] = [
        ...(canDelete ? [{
            key: 'select',
            header: (
                <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleAll(allRows)}
                />
            ),
            cell: (row: UserRow) => (
                <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={() => toggleRow(row.id)}
                    disabled={row.id === currentUserId}
                />
            ),
            className: 'w-10',
            headerClassName: 'w-10',
        }] : []),
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            sortAccessor: (row) => row.name,
            cell: (row) => (
                canEdit ? (
                    <Link
                        href={route('users.edit', row.id)}
                        className="font-medium text-foreground hover:underline"
                    >
                        {row.name}
                    </Link>
                ) : (
                    <span className="font-medium">{row.name}</span>
                )
            ),
        },
        {
            key: 'email',
            header: 'Email',
            sortable: true,
            sortAccessor: (row) => row.email,
            cell: (row) => row.email,
        },
        {
            key: 'roles',
            header: 'Roles',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roles.map((role) => (
                        <Badge key={role.id} variant="secondary">
                            {role.name}
                        </Badge>
                    ))}
                    {row.roles.length === 0 && (
                        <span className="text-sm text-muted-foreground">No role</span>
                    )}
                </div>
            ),
        },
        {
            key: 'created_at',
            header: 'Created',
            sortable: true,
            sortAccessor: (row) => row.created_at,
            cell: (row) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Users</h1>}
        >
            <Head title="Users" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage application users and their roles.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canDelete && selectedIds.size > 0 && (
                            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                                <Trash2 className="mr-2 w-4 h-4" />
                                Delete{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
                            </Button>
                        )}
                        {hasPermission('users.create') && (
                            <Button asChild>
                                <Link href={route('users.create')}>
                                    <Plus className="mr-2 w-4 h-4" />
                                    Add User
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={users}
                    rowKey={(row) => row.id}
                    searchable
                    searchPlaceholder="Search users..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    onSearchSubmit={handleSearch}
                    serverSide
                    perPage={users.per_page}
                    onPerPageChange={(value) => {
                        router.get(route('users.index'), { search, per_page: value }, { preserveState: true });
                    }}
                    emptyMessage="No users found."
                />
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete {selectedIds.size > 1 ? `${selectedIds.size} users` : 'user'}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedIds.size > 1
                                ? `${selectedIds.size} users`
                                : 'this user'
                            }? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting ? 'Deleting...' : `Delete ${selectedIds.size > 1 ? `${selectedIds.size} users` : 'user'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
