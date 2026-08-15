import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import {
    FolderOpen,
    Users,
    Settings,
    ShieldCheck,
    Bot,
    HardDrive,
    FileText,
    Trash2,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    ScrollText,
} from 'lucide-react';

export default function Welcome({
    auth,
    canLogin,
    canRegister,
}: PageProps<{ canLogin: boolean; canRegister: boolean; laravelVersion: string; phpVersion: string }>) {
    const features = [
        {
            icon: FolderOpen,
            title: 'File Manager',
            description: 'Upload, organize, and share files with drag-and-drop ease. Full folder hierarchy and starred items.',
        },
        {
            icon: Users,
            title: 'User Management',
            description: 'Create users, assign roles, and control access with granular permissions.',
        },
        {
            icon: ShieldCheck,
            title: 'Roles & Permissions',
            description: 'Fine-grained access control with configurable roles and per-module permissions.',
        },
        {
            icon: Bot,
            title: 'AI Assistant',
            description: 'Built-in AI chatbot to help users navigate and get answers instantly.',
        },
        {
            icon: ScrollText,
            title: 'Activity Logs',
            description: 'Track every action across the application with detailed audit logs.',
        },
        {
            icon: Settings,
            title: 'Configurable Modules',
            description: 'Enable or disable modules on the fly. Tailor the app to your needs.',
        },
    ];

    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-background text-foreground">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Sparkles className="size-5" />
                            </div>
                            <span className="text-lg font-bold">Nova Starter</span>
                        </div>
                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={route('dashboard')}>
                                        Dashboard
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Button variant="ghost" asChild>
                                            <Link href={route('login')}>Log in</Link>
                                        </Button>
                                    )}
                                    {canRegister && (
                                        <Button asChild>
                                            <Link href={route('register')}>Get Started</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden border-b">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                    <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
                                <Sparkles className="size-4 text-primary" />
                                Built with Laravel, React & Inertia.js
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                Build faster,
                                <span className="block text-primary">ship smarter.</span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                                A production-ready starter kit with file management, user roles, AI assistant,
                                and everything you need to launch your next project.
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                {auth.user ? (
                                    <Button size="lg" asChild>
                                        <Link href={route('dashboard')}>
                                            Go to Dashboard
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        {canRegister && (
                                            <Button size="lg" asChild>
                                                <Link href={route('register')}>
                                                    Get Started Free
                                                    <ArrowRight className="ml-2 size-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {canLogin && (
                                            <Button size="lg" variant="outline" asChild>
                                                <Link href={route('login')}>Log in</Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Dashboard Preview Mockup */}
                        <div className="mt-16">
                            <DashboardPreview />
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="border-b">
                    <div className="mx-auto max-w-7xl px-6 py-20">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Everything included, nothing extra
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Powerful features out of the box so you can focus on building your product.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <Card key={feature.title} className="transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                            <feature.icon className="size-5 text-primary" />
                                        </div>
                                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="border-b bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6 py-20">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Modern stack, built to scale
                                </h2>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    Powered by the latest technologies for performance, developer experience,
                                    and maintainability.
                                </p>
                                <ul className="mt-6 space-y-3">
                                    {[
                                        'Laravel 11+ backend with MongoDB support',
                                        'React 18 + TypeScript frontend',
                                        'Inertia.js for seamless SPA experience',
                                        'Tailwind CSS + shadcn/ui components',
                                        'MinIO / S3 compatible file storage',
                                        'Prism-powered AI integration',
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-3">
                                            <CheckCircle2 className="size-5 shrink-0 text-primary" />
                                            <span className="text-sm">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Laravel', value: '11+' },
                                    { label: 'React', value: '18' },
                                    { label: 'TypeScript', value: '5.x' },
                                    { label: 'Tailwind', value: '3.x' },
                                ].map((tech) => (
                                    <Card key={tech.label}>
                                        <CardContent className="p-6 text-center">
                                            <p className="text-3xl font-bold text-primary">{tech.value}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{tech.label}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section>
                    <div className="mx-auto max-w-7xl px-6 py-20">
                        <div className="rounded-2xl border bg-gradient-to-r from-primary/10 to-primary/5 p-12 text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Ready to get started?
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                                Launch your next project in minutes, not weeks.
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                {auth.user ? (
                                    <Button size="lg" asChild>
                                        <Link href={route('dashboard')}>
                                            Open Dashboard
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        {canRegister && (
                                            <Button size="lg" asChild>
                                                <Link href={route('register')}>
                                                    Create Account
                                                    <ArrowRight className="ml-2 size-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {canLogin && (
                                            <Button size="lg" variant="outline" asChild>
                                                <Link href={route('login')}>Log in</Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t">
                    <div className="mx-auto max-w-7xl px-6 py-8">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
                                    <Sparkles className="size-4" />
                                </div>
                                <span className="text-sm font-semibold">Nova Starter</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Build faster, ship smarter.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

function DashboardPreview() {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: FolderOpen, label: 'Files' },
        { icon: Users, label: 'Users' },
        { icon: ShieldCheck, label: 'Roles' },
        { icon: ScrollText, label: 'Activity' },
        { icon: Settings, label: 'Settings' },
    ];

    const files = [
        { name: 'project-proposal.pdf', size: '2.4 MB', icon: FileText, color: 'text-red-500' },
        { name: 'design-mockups.zip', size: '15.8 MB', icon: FolderOpen, color: 'text-blue-500' },
        { name: 'meeting-notes.docx', size: '340 KB', icon: FileText, color: 'text-blue-600' },
        { name: 'budget.xlsx', size: '1.2 MB', icon: FileText, color: 'text-green-600' },
    ];

    return (
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-background shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                    app.nova-starter.localhost/dashboard
                </div>
            </div>

            {/* App layout */}
            <div className="flex h-[420px]">
                {/* Sidebar */}
                <div className="hidden w-48 shrink-0 border-r bg-muted/30 p-3 sm:block">
                    <div className="mb-4 flex items-center gap-2 px-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Sparkles className="size-4" />
                        </div>
                        <span className="text-sm font-bold">Nova</span>
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <div
                                key={item.label}
                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                                    item.active
                                        ? 'bg-primary/10 font-medium text-primary'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                <item.icon className="size-4" />
                                {item.label}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-hidden p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold">Dashboard</h3>
                        <p className="text-xs text-muted-foreground">Welcome back, Admin</p>
                    </div>

                    {/* Stats cards */}
                    <div className="mb-4 grid grid-cols-3 gap-3">
                        <Card className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded bg-primary/10">
                                    <FileText className="size-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">8</p>
                                    <p className="text-[10px] text-muted-foreground">Files</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded bg-blue-500/10">
                                    <HardDrive className="size-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">24 MB</p>
                                    <p className="text-[10px] text-muted-foreground">Used</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded bg-muted">
                                    <Trash2 className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">2</p>
                                    <p className="text-[10px] text-muted-foreground">In Trash</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* File list */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Recent Files</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {files.map((file) => (
                                    <div key={file.name} className="flex items-center gap-3 px-4 py-2">
                                        <file.icon className={`size-4 ${file.color}`} />
                                        <span className="flex-1 truncate text-xs font-medium">{file.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{file.size}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
