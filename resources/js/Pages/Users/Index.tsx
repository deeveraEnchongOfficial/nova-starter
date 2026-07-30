import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { DataTable, type Column, type PaginatedData } from '@/Components/data-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';
import { usePermission } from '@/hooks/use-permission';

interface UserRow {
    id: string;
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

    const handleSearch = (value: string) => {
        router.get(route('users.index'), { search: value }, { preserveState: true });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(route('users.destroy', id));
        }
    };

    const columns: Column<UserRow>[] = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            sortAccessor: (row) => row.name,
            cell: (row) => <span className="font-medium">{row.name}</span>,
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
                        <span className="text-muted-foreground text-sm">No role</span>
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
                <span className="text-muted-foreground text-sm">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            headerClassName: 'text-right',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('users.edit') && (
                        <Button asChild variant="ghost" size="icon">
                            <Link href={route('users.edit', row.id)}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    {hasPermission('users.delete') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(row.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Users</h1>}
        >
            <Head title="Users" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage application users and their roles.</p>
                    </div>
                    {hasPermission('users.create') && (
                        <Button asChild>
                            <Link href={route('users.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Link>
                        </Button>
                    )}
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
        </AuthenticatedLayout>
    );
}
