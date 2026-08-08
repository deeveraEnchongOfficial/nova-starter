import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="flex h-svh w-full items-center justify-center bg-background">
            <Head title="404 — Page Not Found" />

            <div className="flex flex-col items-center gap-6 px-4 text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                    <FileQuestion className="size-10 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-[7rem] font-bold leading-tight tracking-tighter">
                        404
                    </h1>
                    <p className="text-xl font-semibold">Page Not Found</p>
                    <p className="text-muted-foreground">
                        It seems like the page you're looking for
                        <br />
                        does not exist or might have been removed.
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
