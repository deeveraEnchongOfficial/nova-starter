import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Star, Trash2 } from 'lucide-react';

type FilesTab = 'index' | 'starred' | 'shared' | 'trash';

interface FilesTabsProps {
    active: FilesTab;
}

export default function FilesTabs({ active }: FilesTabsProps) {
    const tabs: { key: FilesTab; label: string; route: string; icon?: typeof Star }[] = [
        { key: 'index', label: 'My Files', route: route('files.index') },
        { key: 'starred', label: 'Starred', route: route('files.starred'), icon: Star },
        { key: 'shared', label: 'Shared', route: route('files.shared') },
        { key: 'trash', label: 'Trash', route: route('files.trash'), icon: Trash2 },
    ];

    return (
        <div className="flex gap-2 items-center">
            {tabs.map((tab) => (
                <Link key={tab.key} href={tab.route}>
                    <Button variant={active === tab.key ? 'default' : 'ghost'} size="sm">
                        {tab.icon && <tab.icon className="mr-1 w-4 h-4" />}
                        {tab.label}
                    </Button>
                </Link>
            ))}
        </div>
    );
}
