import { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Share2, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ShareableUser {
    id: string;
    name: string;
    email: string;
}

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceType: 'file' | 'folder';
    resourceId: string;
    resourceName: string;
}

const PERMISSIONS = [
    { value: 'viewer', label: 'Viewer', description: 'Can view and download' },
    { value: 'commenter', label: 'Commenter', description: 'Can view, download, and comment' },
    { value: 'editor', label: 'Editor', description: 'Can view, download, comment, and edit' },
];

export default function ShareDialog({
    open,
    onOpenChange,
    resourceType,
    resourceId,
    resourceName,
}: ShareDialogProps) {
    const [users, setUsers] = useState<ShareableUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [permission, setPermission] = useState('viewer');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/shareable-users');
            setUsers(response.data.users);
        } catch {
            toast.error('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchUsers();
            setSearch('');
            setSelectedUserId(null);
            setPermission('viewer');
        }
    }, [open, fetchUsers]);

    const filteredUsers = users.filter((u) => {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    const handleShare = useCallback(async () => {
        if (!selectedUserId) {
            toast.error('Please select a user to share with.');
            return;
        }

        setSharing(true);
        try {
            const endpoint = resourceType === 'file'
                ? `/api/v1/files/${resourceId}/share`
                : `/api/v1/folders/${resourceId}/share`;

            await axios.post(endpoint, {
                shared_with_id: selectedUserId,
                permission,
            });

            const sharedUser = users.find((u) => u.id === selectedUserId);
            toast.success(`Shared "${resourceName}" with ${sharedUser?.name ?? 'user'}.`);
            onOpenChange(false);
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to share resource.';
            toast.error(message);
        } finally {
            setSharing(false);
        }
    }, [selectedUserId, permission, resourceType, resourceId, resourceName, users, onOpenChange]);

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="size-5" />
                        Share "{resourceName}"
                    </DialogTitle>
                    <DialogDescription>
                        Share this {resourceType} with another user. They'll be able to access it from their Shared page.
                    </DialogDescription>
                </DialogHeader>

                {/* User search and selection */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    {/* User list */}
                    <div className="max-h-48 overflow-y-auto rounded-md border">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {users.length === 0 ? 'No users available to share with.' : 'No users found.'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent ${
                                            selectedUserId === user.id ? 'bg-accent' : ''
                                        }`}
                                    >
                                        <Avatar size="sm">
                                            <AvatarFallback className="text-xs">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">{user.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        {selectedUserId === user.id && (
                                            <div className="flex size-5 items-center justify-center rounded-full bg-primary">
                                                <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Permission selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Permission</label>
                        <Select value={permission} onValueChange={setPermission}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERMISSIONS.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        <div className="flex flex-col">
                                            <span>{p.label}</span>
                                            <span className="text-xs text-muted-foreground">{p.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={sharing || !selectedUserId}>
                        {sharing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Sharing...
                            </>
                        ) : (
                            <>
                                <Share2 className="size-4" />
                                Share
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
