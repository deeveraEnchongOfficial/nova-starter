import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DeleteUserForm from './Partials/DeleteUserForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage().props.auth.user!;

    const initials = [user.first_name, user.last_name]
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Avatar size="lg" className="size-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {initials || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-semibold">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {user.roles.length > 0 && (
                        <div className="ml-auto hidden gap-1 sm:flex">
                            {user.roles.map((role) => (
                                <Badge key={role} variant="secondary" className="capitalize">
                                    {role}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Update your account's profile information and email address.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Update Password</CardTitle>
                        <CardDescription>
                            Ensure your account is using a long, random password to stay secure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>

                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-destructive">Delete Account</CardTitle>
                        <CardDescription>
                            Once your account is deleted, all of its resources and data will be
                            permanently deleted. Before deleting your account, please download any
                            data or information that you wish to retain.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeleteUserForm />
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
