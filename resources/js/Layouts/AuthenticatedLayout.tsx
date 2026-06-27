import { Sidebar } from '@/Components/layout/Sidebar';
import { Header } from '@/Components/layout/Header';
import { ThemeProvider } from '@/Components/theme-provider';
import { Toaster } from '@/Components/ui/sonner';
import { TooltipProvider } from '@/Components/ui/tooltip';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import type { PageProps } from '@/types';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { branding } = usePage<PageProps>().props;

    return (
        <ThemeProvider defaultTheme={branding.theme.default_mode}>
            <TooltipProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                    <Sidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header />
                        <main className="flex-1 overflow-y-auto p-6">
                            {header && <div className="mb-6">{header}</div>}
                            {children}
                        </main>
                    </div>
                </div>
                <Toaster />
            </TooltipProvider>
        </ThemeProvider>
    );
}
