import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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

interface PaginatedUsers {
    data: UserRow[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function UsersIndex({
    users,
    filters,
}: PageProps<{ users: PaginatedUsers; filters: { search?: string } }>) {
    const [search, setSearch] = useState(filters.search || '');
    const { hasPermission } = usePermission();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('users.index'), { search }, { preserveState: true });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(route('users.destroy', id));
        }
    };

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

                <Card>
                    <CardHeader>
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="pl-8"
                                />
                            </div>
                            <Button type="submit" variant="secondary" size="sm">Search</Button>
                        </form>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map((role) => (
                                                    <Badge key={role.id} variant="secondary">
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                                {user.roles.length === 0 && (
                                                    <span className="text-muted-foreground text-sm">No role</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasPermission('users.edit') && (
                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link href={route('users.edit', user.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {hasPermission('users.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(user.id)}
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
                                Showing {users.from} to {users.to} of {users.total} users
                            </p>
                            <div className="flex gap-1">
                                {users.links.map((link, i) => (
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
