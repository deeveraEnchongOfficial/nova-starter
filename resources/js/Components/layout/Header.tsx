import { Link } from '@inertiajs/react';
import { LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { useTheme } from '@/Components/theme-provider';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export function Header() {
    const { auth, features } = usePage<PageProps>().props;
    const { theme, setTheme, resolvedTheme } = useTheme();

    const initials = auth.user
        ? auth.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                    {document.title.replace(/ - .+$/, '')}
                </h2>
            </div>

            <div className="flex items-center gap-2">
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {auth.user?.name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {auth.user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={route('profile.edit')}>
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
