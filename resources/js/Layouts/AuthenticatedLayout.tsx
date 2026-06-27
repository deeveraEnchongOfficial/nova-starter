import { AppSidebar } from '@/Components/layout/AppSidebar';
import { Header } from '@/Components/layout/Header';
import { Main } from '@/Components/layout/Main';
import { ThemeProvider } from '@/Components/theme-provider';
import { Toaster } from '@/Components/ui/sonner';
import { SidebarInset, SidebarProvider } from '@/Components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { PageProps } from '@/types';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { branding } = usePage<PageProps>().props;
    const defaultOpen = Cookies.get('sidebar_state') !== 'false';

    return (
        <ThemeProvider defaultTheme={branding.theme.default_mode}>
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <SidebarInset className="@container/content">
                    <Header fixed>
                        {header}
                    </Header>
                    <Main>
                        {children}
                    </Main>
                </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </ThemeProvider>
    );
}
