import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/icons';
import { usePermission } from '@/hooks/use-permission';
import type { NavItem } from '@/types';
import type { PageProps } from '@/types';

export function Sidebar() {
    const { branding } = usePage<PageProps>().props;
    const { navigation } = usePage<PageProps>().props;

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
                <Link href={route('dashboard')} className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                        {branding.short_name || branding.name}
                    </span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navigation.map((item, index) => (
                    <SidebarItem key={index} item={item} />
                ))}
            </nav>

            <div className="border-t border-sidebar-border px-6 py-3">
                <p className="text-xs text-muted-foreground">{branding.tagline}</p>
            </div>
        </aside>
    );
}

function SidebarItem({ item }: { item: NavItem }) {
    const { hasPermission } = usePermission();
    const [open, setOpen] = useState(false);

    if (item.permission && !hasPermission(item.permission)) {
        return null;
    }

    const Icon = getIcon(item.icon);
    const isActive = item.route ? route().current(item.route) : false;

    if (item.children && item.children.length > 0) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="flex-1 text-left">{item.label}</span>
                    {open ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
                {open && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                        {item.children.map((child, i) => (
                            <SidebarItem key={i} item={child} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.route ? route(item.route) : '#'}
            className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
        >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
        </Link>
    );
}
