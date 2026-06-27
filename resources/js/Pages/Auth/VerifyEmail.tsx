import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2, MailCheck } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <Card className="max-w-sm gap-4">
                <CardHeader>
                    <CardTitle className="text-lg tracking-tight">Verify Email</CardTitle>
                    <CardDescription>
                        Thanks for signing up! Before getting started, could you
                        verify your email address by clicking on the link we just
                        emailed to you? If you didn't receive the email, we will
                        gladly send you another.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {status === 'verification-link-sent' && (
                        <div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                            A new verification link has been sent to the email
                            address you provided during registration.
                        </div>
                    )}

                    <form onSubmit={submit} className="grid gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <MailCheck />
                            )}
                            Resend Verification Email
                        </Button>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
                        >
                            Log Out
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
