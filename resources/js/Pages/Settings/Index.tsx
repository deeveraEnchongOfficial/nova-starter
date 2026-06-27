import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { Separator } from '@/Components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsContent } from '@/Components/ui/tabs';
import { useState } from 'react';
import { Palette, Boxes, ToggleLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PageProps, Module } from '@/types';

const sidebarNavItems = [
    { title: 'Branding', value: 'branding', icon: <Palette size={18} /> },
    { title: 'Modules', value: 'modules', icon: <Boxes size={18} /> },
    { title: 'Features', value: 'features', icon: <ToggleLeft size={18} /> },
];

export default function SettingsIndex({
    settings,
    modules,
}: PageProps<{
    settings: Record<string, Record<string, unknown>>;
    modules: Record<string, Module>;
}>) {
    const [tab, setTab] = useState('branding');

    const [branding, setBranding] = useState({
        name: (settings.branding?.name as string) || '',
        short_name: (settings.branding?.short_name as string) || '',
        tagline: (settings.branding?.tagline as string) || '',
        logo: (settings.branding?.logo as string) || '',
    });

    const [moduleStates, setModuleStates] = useState<Record<string, boolean>>(
        Object.fromEntries(
            Object.entries(modules).map(([key, mod]) => [key, mod.enabled])
        )
    );

    const saveBranding = (e: React.FormEvent) => {
        e.preventDefault();
        const settingData = Object.entries(branding).map(([key, value]) => ({
            key,
            value,
            type: 'string',
            group: 'branding',
            is_public: true,
        }));

        router.post(route('settings.update'), { settings: settingData }, {
            onSuccess: () => toast.success('Branding settings saved.'),
        });
    };

    const saveModules = () => {
        router.post(route('settings.modules.update'), { modules: moduleStates }, {
            onSuccess: () => toast.success('Module settings saved.'),
        });
    };

    const toggleModule = (key: string) => {
        setModuleStates((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Settings</h1>}
        >
            <Head title="Settings" />

            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage application branding, modules, and configuration.
                </p>
            </div>

            <Separator className="my-4 lg:my-6" />

            <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="top-0 lg:w-1/5">
                    <SidebarNav value={tab} onChange={setTab} />
                </aside>
                <div className="flex w-full overflow-y-hidden p-1">
                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsContent value="branding" className="w-full">
                            <ContentSection
                                title="Branding"
                                desc="Configure your application name, tagline, and logo."
                            >
                                <form onSubmit={saveBranding} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Application Name</Label>
                                        <Input
                                            id="name"
                                            value={branding.name}
                                            onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="short_name">Short Name</Label>
                                        <Input
                                            id="short_name"
                                            value={branding.short_name}
                                            onChange={(e) => setBranding({ ...branding, short_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tagline">Tagline</Label>
                                        <Input
                                            id="tagline"
                                            value={branding.tagline}
                                            onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="logo">Logo URL</Label>
                                        <Input
                                            id="logo"
                                            value={branding.logo}
                                            onChange={(e) => setBranding({ ...branding, logo: e.target.value })}
                                            placeholder="https://example.com/logo.png"
                                        />
                                    </div>

                                    <Button type="submit">Save Branding</Button>
                                </form>
                            </ContentSection>
                        </TabsContent>

                        <TabsContent value="modules" className="w-full">
                            <ContentSection
                                title="Modules"
                                desc="Enable or disable application modules."
                            >
                                <div className="space-y-4">
                                    {Object.entries(modules).map(([key, module]) => (
                                        <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`module-${key}`}
                                                    checked={moduleStates[key]}
                                                    onCheckedChange={() => toggleModule(key)}
                                                />
                                                <div>
                                                    <Label htmlFor={`module-${key}`} className="cursor-pointer font-medium">
                                                        {module.label}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Route: {module.route} | Permission: {module.permission}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                'text-sm font-medium',
                                                moduleStates[key] ? 'text-green-600' : 'text-muted-foreground'
                                            )}>
                                                {moduleStates[key] ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={saveModules} className="mt-4">Save Modules</Button>
                            </ContentSection>
                        </TabsContent>

                        <TabsContent value="features" className="w-full">
                            <ContentSection
                                title="Feature Toggles"
                                desc="Enable or disable application features."
                            >
                                <div className="space-y-3">
                                    {Object.entries(settings.features || {}).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                            <Label className="cursor-pointer font-medium capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </Label>
                                            <Checkbox checked={Boolean(value)} disabled />
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Feature toggles are configured via environment variables. Update your <code>.env</code> file to change these values.
                                </p>
                            </ContentSection>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SidebarNav({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <>
            <div className="p-1 md:hidden">
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-12 sm:w-48">
                        <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                        {sidebarNavItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                <div className="flex gap-x-4 px-2 py-1">
                                    <span className="scale-125">{item.icon}</span>
                                    <span className="text-md">{item.title}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <nav className="hidden w-full min-w-40 bg-background px-1 py-2 md:block">
                <ul className="flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0">
                    {sidebarNavItems.map((item) => (
                        <li key={item.value}>
                            <button
                                onClick={() => onChange(item.value)}
                                className={cn(
                                    buttonVariants({ variant: 'ghost' }),
                                    value === item.value
                                        ? 'bg-muted hover:bg-accent'
                                        : 'hover:bg-accent hover:underline',
                                    'justify-start w-full'
                                )}
                            >
                                <span className="me-2">{item.icon}</span>
                                {item.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}

function ContentSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex-none">
                <h3 className="text-lg font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <Separator className="my-4 flex-none" />
            <div className="h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12">
                <div className="-mx-1 px-1.5">{children}</div>
            </div>
        </div>
    );
}
