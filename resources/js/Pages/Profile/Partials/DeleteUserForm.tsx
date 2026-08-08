import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <div className={className}>
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium">Delete this account</p>
                    <p className="text-sm text-muted-foreground">
                        All resources and data will be permanently deleted.
                    </p>
                </div>
                <Dialog open={confirmingUserDeletion} onOpenChange={(open) => !open && closeModal()}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={deleteUser}>
                            <DialogHeader>
                                <DialogTitle>Delete account?</DialogTitle>
                                <DialogDescription>
                                    Once your account is deleted, all of its resources and data
                                    will be permanently deleted. Please enter your password to
                                    confirm you would like to permanently delete your account.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 space-y-2">
                                <Label htmlFor="password" className="sr-only">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Enter your password"
                                    autoFocus
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    Delete account
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
