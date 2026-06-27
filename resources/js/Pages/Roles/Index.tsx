import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { PageProps } from '@/types';
import { usePermission } from '@/hooks/use-permission';

interface RoleRow {
    id: number;
    name: string;
    users_count: number;
    permissions: { id: number; name: string }[];
}

interface PaginatedRoles {
    data: RoleRow[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function RolesIndex({
    roles,
}: PageProps<{ roles: PaginatedRoles }>) {
    const { hasPermission } = usePermission();
    const handleDelete = (id: number, name: string) => {
        if (name === 'Super Admin') {
            alert('Cannot delete the Super Admin role.');
            return;
        }
        if (confirm(`Are you sure you want to delete the role "${name}"?`)) {
            router.delete(route('roles.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Roles & Permissions</h1>}
        >
            <Head title="Roles & Permissions" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
                        <p className="text-muted-foreground">Manage roles and their permissions.</p>
                    </div>
                    {hasPermission('roles.create') && (
                        <Button asChild>
                            <Link href={route('roles.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Role
                            </Link>
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.data.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.users_count}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 5).map((perm) => (
                                                    <Badge key={perm.id} variant="outline">
                                                        {perm.name}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 5 && (
                                                    <Badge variant="outline">
                                                        +{role.permissions.length - 5} more
                                                    </Badge>
                                                )}
                                                {role.permissions.length === 0 && (
                                                    <span className="text-muted-foreground text-sm">No permissions</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasPermission('roles.edit') && (
                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link href={route('roles.edit', role.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {hasPermission('roles.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(role.id, role.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {roles.from} to {roles.to} of {roles.total} roles
                            </p>
                            <div className="flex gap-1">
                                {roles.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        asChild={!!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                preserveState
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
