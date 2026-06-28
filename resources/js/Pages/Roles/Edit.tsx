import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import type { PageProps } from '@/types';

interface Permission {
    id: string;
    name: string;
}

interface RoleData {
    id: string;
    name: string;
    permissions: { id: string; name: string }[];
}

export default function RolesEdit({
    role,
    permissions,
}: PageProps<{ role: RoleData; permissions: Permission[] }>) {
    const { data, setData, put, errors, processing } = useForm({
        name: role.name,
        permissions: role.permissions.map((p) => p.id),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    const togglePermission = (permId: string) => {
        setData('permissions', data.permissions.includes(permId)
            ? data.permissions.filter((id) => id !== permId)
            : [...data.permissions, permId]);
    };

    const groupedPermissions = permissions.reduce((acc, perm) => {
        const group = perm.name.split('.')[0];
        if (!acc[group]) acc[group] = [];
        acc[group].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Edit Role</h1>}
        >
            <Head title={`Edit ${role.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={route('roles.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Role</h1>
                        <p className="text-muted-foreground">Update role name and permissions.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Role Details</CardTitle>
                        <CardDescription>Modify the role and its assigned permissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Permissions</Label>
                                <div className="space-y-4">
                                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                                        <div key={group}>
                                            <p className="mb-2 text-sm font-medium capitalize">{group}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map((perm) => (
                                                    <div key={perm.id} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`perm-${perm.id}`}
                                                            checked={data.permissions.includes(perm.id)}
                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                        />
                                                        <Label htmlFor={`perm-${perm.id}`} className="cursor-pointer text-sm">
                                                            {perm.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.permissions && <p className="text-sm text-destructive">{errors.permissions}</p>}
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>Update Role</Button>
                                <Button asChild variant="outline">
                                    <Link href={route('roles.index')}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
