import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { DataTable, type Column, type PaginatedData } from '@/Components/data-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { PageProps } from '@/types';
import { usePermission } from '@/hooks/use-permission';

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

    const handleDelete = (id: string, name: string) => {
        if (name === 'Super Admin') {
            alert('Cannot delete the Super Admin role.');
            return;
        }
        if (confirm(`Are you sure you want to delete the role "${name}"?`)) {
            router.delete(route('roles.destroy', id));
        }
    };

    const columns: Column<RoleRow>[] = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            sortAccessor: (row) => row.name,
            cell: (row) => <span className="font-medium">{row.name}</span>,
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
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            headerClassName: 'text-right',
            cell: (row) => (
                <div className="flex gap-2 justify-end">
                    {hasPermission('roles.edit') && (
                        <Button asChild variant="ghost" size="icon">
                            <Link href={route('roles.edit', row.id)}>
                                <Pencil className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}
                    {hasPermission('roles.delete') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(row.id, row.name)}
                        >
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
                    {hasPermission('roles.create') && (
                        <Button asChild>
                            <Link href={route('roles.create')}>
                                <Plus className="mr-2 w-4 h-4" />
                                Add Role
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={roles}
                    rowKey={(row) => row.id}
                    emptyMessage="No roles found."
                />
            </div>
        </AuthenticatedLayout>
    );
}
