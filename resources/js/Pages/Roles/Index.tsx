import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
import type { PageProps } from '@/types';
import { usePermission } from '@/hooks/use-permission';
import { toast } from 'sonner';
import { useState } from 'react';

interface RoleRow {
    id: string;
    name: string;
    users_count: number;
    permissions: { id: string; name: string }[];
}

export default function RolesIndex({
    roles,
}: PageProps<{ roles: PaginatedData<RoleRow> }>) {
    const { hasPermission } = usePermission();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const toggleAll = (rows: RoleRow[]) => {
        setSelectedIds((prev) => {
            const allSelected = rows.every((r) => prev.has(r.id));
            if (allSelected) {
                return new Set();
            }
            return new Set(rows.map((r) => r.id));
        });
    };

    const handleBulkDelete = () => {
        const ids = Array.from(selectedIds);
        const count = ids.length;
        setDeleting(true);
        let successCount = 0;
        let failureCount = 0;
        ids.forEach((id, idx) => {
            router.delete(route('roles.destroy', id), {
                preserveScroll: true,
                onSuccess: () => {
                    successCount++;
                    if (idx === count - 1) {
                        setDeleting(false);
                        if (failureCount > 0) {
                            toast.error(`Failed to delete ${failureCount} role${failureCount > 1 ? 's' : ''}.`);
                        }
                        if (successCount > 0) {
                            toast.success(`Deleted ${successCount > 1 ? `${successCount} roles` : 'role'} successfully.`);
                        }
                    }
                },
                onError: () => {
                    failureCount++;
                    if (idx === count - 1) {
                        setDeleting(false);
                        if (successCount > 0) {
                            toast.success(`Deleted ${successCount > 1 ? `${successCount} roles` : 'role'} successfully.`);
                        }
                        if (failureCount > 0) {
                            toast.error(`Failed to delete ${failureCount} role${failureCount > 1 ? 's' : ''}.`);
                        }
                    }
                },
            });
        });
        setSelectedIds(new Set());
        setShowDeleteDialog(false);
    };

    const canDelete = hasPermission('roles.delete');
    const canEdit = hasPermission('roles.edit');

    const allRows = roles.data;
    const allSelected = allRows.length > 0 && allRows.every((r) => selectedIds.has(r.id));

    const columns: Column<RoleRow>[] = [
        ...(canDelete ? [{
            key: 'select',
            header: (
                <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleAll(allRows)}
                />
            ),
            cell: (row: RoleRow) => (
                <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={() => toggleRow(row.id)}
                    disabled={row.name === 'Super Admin'}
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
                        href={route('roles.edit', row.id)}
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
            key: 'users_count',
            header: 'Users',
            sortable: true,
            sortAccessor: (row) => row.users_count,
            cell: (row) => row.users_count,
        },
        {
            key: 'permissions',
            header: 'Permissions',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.permissions.slice(0, 5).map((perm) => (
                        <Badge key={perm.id} variant="outline">
                            {perm.name}
                        </Badge>
                    ))}
                    {row.permissions.length > 5 && (
                        <Badge variant="outline">
                            +{row.permissions.length - 5} more
                        </Badge>
                    )}
                    {row.permissions.length === 0 && (
                        <span className="text-sm text-muted-foreground">No permissions</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Roles & Permissions</h1>}
        >
            <Head title="Roles & Permissions" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
                        <p className="text-muted-foreground">Manage roles and their permissions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canDelete && selectedIds.size > 0 && (
                            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                                <Trash2 className="mr-2 w-4 h-4" />
                                Delete{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
                            </Button>
                        )}
                        {hasPermission('roles.create') && (
                            <Button asChild>
                                <Link href={route('roles.create')}>
                                    <Plus className="mr-2 w-4 h-4" />
                                    Add Role
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={roles}
                    rowKey={(row) => row.id}
                    emptyMessage="No roles found."
                />
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete {selectedIds.size > 1 ? `${selectedIds.size} roles` : 'role'}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedIds.size > 1
                                ? `${selectedIds.size} roles`
                                : 'this role'
                            }? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting ? 'Deleting...' : `Delete ${selectedIds.size > 1 ? `${selectedIds.size} roles` : 'role'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
