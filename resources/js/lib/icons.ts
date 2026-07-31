import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Settings2,
    FolderOpen,
    ScrollText,
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
};

export function getIcon(name: string | null): LucideIcon | null {
    if (!name) return null;
    return iconMap[name] ?? null;
}
