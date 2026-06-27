import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export function usePermission() {
    const { auth } = usePage<PageProps>().props;

    const hasPermission = (permission: string | null): boolean => {
        if (!permission) return true;
        if (!auth.user) return false;
        return auth.user.permissions.includes(permission);
    };

    const hasRole = (role: string | string[]): boolean => {
        if (!auth.user) return false;
        const roles = auth.user.roles;
        if (Array.isArray(role)) {
            return role.some((r) => roles.includes(r));
        }
        return roles.includes(role);
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!auth.user) return false;
        return permissions.some((p) => auth.user!.permissions.includes(p));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!auth.user) return false;
        return permissions.every((p) => auth.user!.permissions.includes(p));
    };

    return { hasPermission, hasRole, hasAnyPermission, hasAllPermissions };
}
