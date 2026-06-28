import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import type { PageProps } from '@/types';

export default function Register({ features }: PageProps) {
    const isMultiTenant = features.multi_tenant;

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        role: '',
        email: '',
        password: '',
        password_confirmation: '',
        organization_name: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <Card className="max-w-sm gap-4">
                <CardHeader>
                    <CardTitle className="text-lg tracking-tight">
                        Create an account
                    </CardTitle>
                    <CardDescription>
                        Enter your details below to create an account. <br />
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign In
                        </Link>
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={submit} className="grid gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                value={data.first_name}
                                placeholder="John"
                                autoComplete="given-name"
                                autoFocus
                                onChange={(e) => setData('first_name', e.target.value)}
                                required
                            />
                            {errors.first_name && (
                                <p className="text-sm text-destructive">{errors.first_name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="middle_name">Middle Name</Label>
                            <Input
                                id="middle_name"
                                name="middle_name"
                                value={data.middle_name}
                                placeholder=""
                                autoComplete="additional-name"
                                onChange={(e) => setData('middle_name', e.target.value)}
                            />
                            {errors.middle_name && (
                                <p className="text-sm text-destructive">{errors.middle_name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                value={data.last_name}
                                placeholder="Doe"
                                autoComplete="family-name"
                                onChange={(e) => setData('last_name', e.target.value)}
                                required
                            />
                            {errors.last_name && (
                                <p className="text-sm text-destructive">{errors.last_name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Input
                                id="role"
                                name="role"
                                value={data.role}
                                placeholder="e.g. Super Admin, Manager, Developer, etc."
                                onChange={(e) => setData('role', e.target.value)}
                                required
                            />
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role}</p>
                            )}
                        </div>

                        {isMultiTenant && (
                            <div className="grid gap-2">
                                <Label htmlFor="organization_name">Organization Name</Label>
                                <Input
                                    id="organization_name"
                                    name="organization_name"
                                    value={data.organization_name}
                                    placeholder="Acme Corp"
                                    autoComplete="organization"
                                    onChange={(e) => setData('organization_name', e.target.value)}
                                    required
                                />
                                {errors.organization_name && (
                                    <p className="text-sm text-destructive">{errors.organization_name}</p>
                                )}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder="name@example.com"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                placeholder="********"
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                placeholder="********"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                required
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="mt-2" disabled={processing}>
                            {processing ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <UserPlus />
                            )}
                            Create Account
                        </Button>
                    </form>
                </CardContent>

                <CardFooter>
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        By creating an account, you agree to our{' '}
                        <a
                            href="#"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                            href="#"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>
                </CardFooter>
            </Card>
        </GuestLayout>
    );
}
