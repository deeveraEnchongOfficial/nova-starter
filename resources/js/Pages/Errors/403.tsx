import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export default function Forbidden() {
    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="flex h-svh w-full items-center justify-center bg-background">
            <Head title="403 — Access Forbidden" />

            <div className="flex flex-col items-center gap-6 px-4 text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
                    <ShieldX className="size-10 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-[7rem] font-bold leading-tight tracking-tighter text-destructive">
                        403
                    </h1>
                    <p className="text-xl font-semibold">Access Forbidden</p>
                    <p className="text-muted-foreground">
                        You don't have the necessary permission
                        <br />
                        to view this resource.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={goBack}>
                        <ArrowLeft className="size-4" />
                        Go Back
                    </Button>
                    <Button asChild>
                        <Link href={route('dashboard')}>
                            <Home className="size-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
