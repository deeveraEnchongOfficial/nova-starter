import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Head, usePage } from '@inertiajs/react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Download, DollarSign, Users, TrendingUp, Activity, HardDrive, FileText, Trash2 } from 'lucide-react';
import type { PageProps } from '@/types';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

const chartData = [
    { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Aug', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Sep', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Oct', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Dec', total: Math.floor(Math.random() * 5000) + 1000 },
];

export default function Dashboard() {
    const { auth, branding } = usePage<PageProps>().props;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Dashboard</h1>}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Welcome back, {auth.user?.name}
                        </h1>
                        <p className="text-muted-foreground">{branding.tagline}</p>
                    </div>
                    <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
                        <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {auth.user?.roles.join(', ') || 'No role'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Assigned roles
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {auth.user?.permissions.length || 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Total permissions granted
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Theme</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold capitalize">
                                        {branding.theme.default_mode}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Current appearance
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">App Name</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{branding.name}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {branding.short_name}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                            <Card className="col-span-1 lg:col-span-4">
                                <CardHeader>
                                    <CardTitle>Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="ps-2">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={chartData}>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Bar
                                                dataKey="total"
                                                fill="currentColor"
                                                radius={[4, 4, 0, 0]}
                                                className="fill-primary"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="col-span-1 lg:col-span-3">
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>
                                        Your account activity this month.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RecentActivity name={auth.user?.name || ''} email={auth.user?.email || ''} />
                                </CardContent>
                            </Card>
                        </div>

                        <StorageWidget />
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics</CardTitle>
                                <CardDescription>
                                    Detailed analytics will be available here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="ps-2">
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={chartData}>
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="currentColor"
                                            radius={[4, 4, 0, 0]}
                                            className="fill-primary"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}

function RecentActivity({ name, email }: { name: string; email: string }) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-wrap items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{name}</p>
                        <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <div className="font-medium">Active</div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Avatar className="flex h-9 w-9 items-center justify-center border">
                    <AvatarFallback>N</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-wrap items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Nova Starter</p>
                        <p className="text-sm text-muted-foreground">System initialized</p>
                    </div>
                    <div className="font-medium">Ready</div>
                </div>
            </div>
        </div>
    );
}

interface StorageData {
    used: number;
    capacity: number | null;
    file_count: number;
    trashed_count: number;
    available: number | null;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function StorageWidget() {
    const [data, setData] = useState<StorageData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStorage = useCallback(async () => {
        try {
            const response = await axios.get('/api/v1/storage/usage');
            setData(response.data);
        } catch {
            // silently fail — widget is non-critical
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStorage();
    }, [fetchStorage]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Storage</CardTitle>
                    <CardDescription>Loading storage usage...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const usedPercent = data.capacity ? Math.min(100, (data.used / data.capacity) * 100) : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    Storage
                </CardTitle>
                <CardDescription>Your file storage usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Usage bar */}
                {data.capacity !== null && usedPercent !== null ? (
                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold">{formatBytes(data.used)}</span>
                            <span className="text-sm text-muted-foreground">
                                of {formatBytes(data.capacity)}
                            </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    usedPercent > 90
                                        ? 'bg-destructive'
                                        : usedPercent > 70
                                          ? 'bg-amber-500'
                                          : 'bg-primary'
                                }`}
                                style={{ width: `${usedPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{usedPercent.toFixed(1)}% used</span>
                            <span>{formatBytes(data.available ?? 0)} free</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <span className="text-2xl font-bold">{formatBytes(data.used)}</span>
                        <p className="text-xs text-muted-foreground">Total used</p>
                    </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                            <p className="text-lg font-bold">{data.file_count}</p>
                            <p className="text-xs text-muted-foreground">Files</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Trash2 className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="text-lg font-bold">{data.trashed_count}</p>
                            <p className="text-xs text-muted-foreground">In Trash</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
