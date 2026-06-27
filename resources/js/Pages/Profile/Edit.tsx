import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-xl font-semibold">
                    Profile
                </h1>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-4 text-card-foreground sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>

                    <div className="rounded-lg border bg-card p-4 text-card-foreground sm:p-8">
                        <UpdatePasswordForm />
                    </div>

                    <div className="rounded-lg border bg-card p-4 text-card-foreground sm:p-8">
                        <DeleteUserForm />
                    </div>
            </div>
        </AuthenticatedLayout>
    );
}
