import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ServerCrash, ArrowLeft, Home } from 'lucide-react';

export default function ServerError() {
    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="flex h-svh w-full items-center justify-center bg-background">
            <Head title="500 — Server Error" />

            <div className="flex flex-col items-center gap-6 px-4 text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
                    <ServerCrash className="size-10 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-[7rem] font-bold leading-tight tracking-tighter text-destructive">
                        500
                    </h1>
                    <p className="text-xl font-semibold">Server Error</p>
                    <p className="text-muted-foreground">
                        Something went wrong on our end.
                        <br />
                        Please try again later.
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
