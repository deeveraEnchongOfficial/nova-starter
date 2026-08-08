import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Settings2,
    FolderOpen,
    ScrollText,
    Bot,
    type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Settings2,
    FolderOpen,
    ScrollText,
    Bot,
};

export function getIcon(name: string | null): LucideIcon | null {
    if (!name) return null;
    return iconMap[name] ?? null;
}
