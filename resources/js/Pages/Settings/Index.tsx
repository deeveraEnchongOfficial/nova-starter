import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';
import type { PageProps, Module } from '@/types';

export default function SettingsIndex({
    settings,
    modules,
}: PageProps<{
    settings: Record<string, Record<string, unknown>>;
    modules: Record<string, Module>;
}>) {
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
            header={<h2 className="text-xl font-semibold leading-tight">Settings</h2>}
        >
            <Head title="Settings" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage application branding, modules, and configuration.</p>
                </div>

                <Tabs defaultValue="branding">
                    <TabsList>
                        <TabsTrigger value="branding">Branding</TabsTrigger>
                        <TabsTrigger value="modules">Modules</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="branding">
                        <Card className="max-w-2xl">
                            <CardHeader>
                                <CardTitle>Branding</CardTitle>
                                <CardDescription>Configure your application name, tagline, and logo.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="modules">
                        <Card className="max-w-2xl">
                            <CardHeader>
                                <CardTitle>Modules</CardTitle>
                                <CardDescription>Enable or disable application modules.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                            <span className={`text-sm font-medium ${moduleStates[key] ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                {moduleStates[key] ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Button onClick={saveModules} className="mt-4">Save Modules</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="features">
                        <Card className="max-w-2xl">
                            <CardHeader>
                                <CardTitle>Feature Toggles</CardTitle>
                                <CardDescription>Enable or disable application features.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
