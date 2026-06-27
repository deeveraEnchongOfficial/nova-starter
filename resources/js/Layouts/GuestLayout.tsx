import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import type { PageProps } from '@/types';

export default function Guest({ children }: PropsWithChildren) {
    const { branding } = usePage<PageProps>().props;

    return (
        <div className="container grid h-svh max-w-none items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8">
                <div className="mb-4 flex items-center justify-center">
                    <div className="me-2 flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="text-sm font-bold">
                            {branding.short_name?.charAt(0) || branding.name.charAt(0)}
                        </span>
                    </div>
                    <h1 className="text-xl font-medium">{branding.name}</h1>
                </div>
                {children}
            </div>
        </div>
    );
}
