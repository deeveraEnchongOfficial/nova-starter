import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, MailX } from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user!;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            first_name: user.first_name ?? '',
            middle_name: user.middle_name ?? '',
            last_name: user.last_name ?? '',
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className={className}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                        id="first_name"
                        value={data.first_name}
                        onChange={(e) => setData('first_name', e.target.value)}
                        required
                        autoFocus
                        autoComplete="given-name"
                    />
                    {errors.first_name && (
                        <p className="text-sm text-destructive">{errors.first_name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                        id="last_name"
                        value={data.last_name}
                        onChange={(e) => setData('last_name', e.target.value)}
                        required
                        autoComplete="family-name"
                    />
                    {errors.last_name && (
                        <p className="text-sm text-destructive">{errors.last_name}</p>
                    )}
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <Label htmlFor="middle_name">
                    Middle Name <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                    id="middle_name"
                    value={data.middle_name}
                    onChange={(e) => setData('middle_name', e.target.value)}
                    autoComplete="additional-name"
                />
                {errors.middle_name && (
                    <p className="text-sm text-destructive">{errors.middle_name}</p>
                )}
            </div>

            <div className="mt-4 space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        className="pr-24"
                    />
                    {user.email_verified_at ? (
                        <Badge variant="secondary" className="absolute top-1/2 right-1.5 -translate-y-1/2 gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="absolute top-1/2 right-1.5 -translate-y-1/2 gap-1 text-amber-600">
                            <MailX className="w-3 h-3" />
                            Unverified
                        </Badge>
                    )}
                </div>
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                )}
            </div>

            {mustVerifyEmail && user.email_verified_at === null && (
                <Alert className="mt-4">
                    <MailX className="w-4 h-4" />
                    <AlertDescription>
                        Your email address is unverified.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="font-medium underline underline-offset-4 hover:text-foreground"
                        >
                            Click here to re-send the verification email.
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            {status === 'verification-link-sent' && (
                <p className="mt-4 text-sm font-medium text-emerald-600">
                    A new verification link has been sent to your email address.
                </p>
            )}

            <div className="mt-6 flex items-center gap-4">
                <Button type="submit" disabled={processing}>
                    Save changes
                </Button>

                {recentlySuccessful && (
                    <span className="text-sm text-muted-foreground">Saved.</span>
                )}
            </div>
        </form>
    );
}
