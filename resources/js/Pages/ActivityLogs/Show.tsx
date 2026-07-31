import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { ArrowLeft } from 'lucide-react';
import type { PageProps } from '@/types';

interface Activity {
    id: string;
    type: string;
    description: string;
    route: string | null;
    method: string | null;
    ip_address: string | null;
    user_agent: string | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    created_by: { id: string; name: string; email: string } | null;
    subject_type: string | null;
    subject_id: string | null;
}

export default function ActivityLogsShow({
    activity,
}: PageProps<{ activity: Activity }>) {
    return (
        <AuthenticatedLayout
            header={<h1 className="text-xl font-semibold">Activity Log Detail</h1>}
        >
            <Head title={`Activity Log — ${activity.description}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={route('activity-logs.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Activity Detail</h1>
                        <p className="text-muted-foreground">{activity.description}</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Information</CardTitle>
                            <CardDescription>Details about the logged action.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Type</span>
                                <Badge variant="secondary">{activity.type}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Description</span>
                                <span className="text-sm text-muted-foreground">{activity.description}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Route</span>
                                <span className="text-sm text-muted-foreground font-mono">{activity.route ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">HTTP Method</span>
                                <span className="text-sm text-muted-foreground font-mono">{activity.method ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Timestamp</span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(activity.created_at).toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actor & Subject</CardTitle>
                            <CardDescription>Who performed the action and what was affected.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Performed By</span>
                                <span className="text-sm text-muted-foreground">
                                    {activity.created_by?.name ?? 'System'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">User Email</span>
                                <span className="text-sm text-muted-foreground">
                                    {activity.created_by?.email ?? '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Subject Type</span>
                                <span className="text-sm text-muted-foreground font-mono">{activity.subject_type ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Subject ID</span>
                                <span className="text-sm text-muted-foreground font-mono">{activity.subject_id ?? '—'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Request Details</CardTitle>
                            <CardDescription>Network and client information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">IP Address</span>
                                <span className="text-sm text-muted-foreground font-mono">{activity.ip_address ?? '—'}</span>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-sm font-medium shrink-0">User Agent</span>
                                <span className="text-sm text-muted-foreground break-all text-right">
                                    {activity.user_agent ?? '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {activity.properties && Object.keys(activity.properties).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Properties</CardTitle>
                                <CardDescription>Additional contextual data captured with this event.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-80">
                                    {JSON.stringify(activity.properties, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
