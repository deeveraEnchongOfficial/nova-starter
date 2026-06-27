import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/Components/ui/separator';
import { SidebarTrigger } from '@/Components/ui/sidebar';
import { Button } from '@/Components/ui/button';
import { useTheme } from '@/Components/theme-provider';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
    fixed?: boolean;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
    const { features } = usePage<PageProps>().props;
    const { setTheme, resolvedTheme } = useTheme();
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            setOffset(document.body.scrollTop || document.documentElement.scrollTop);
        };
        document.addEventListener('scroll', onScroll, { passive: true });
        return () => document.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'z-50 h-16',
                fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
                offset > 10 && fixed ? 'shadow' : 'shadow-none',
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    'relative flex h-full items-center gap-3 p-4 sm:gap-4',
                    offset > 10 &&
                        fixed &&
                        'after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg'
                )}
            >
                <SidebarTrigger className="max-md:scale-125" />
                <Separator orientation="vertical" className="h-6" />
                {children}
                <div className="ms-auto flex items-center gap-2">
                    {features.dark_mode && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                            }
                        >
                            {resolvedTheme === 'dark' ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
