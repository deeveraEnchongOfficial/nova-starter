import { Link, router, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/Components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar,
} from '@/Components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { usePermission } from '@/hooks/use-permission';
import type { NavItem, PageProps } from '@/types';

export function AppSidebar() {
    const { branding, navigation } = usePage<PageProps>().props;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')}>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <span className="text-sm font-bold">
                                        {branding.short_name?.charAt(0) || branding.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-semibold">{branding.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{branding.tagline}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>General</SidebarGroupLabel>
                    <SidebarMenu>
                        {navigation.map((item, index) => (
                            <NavSidebarItem key={index} item={item} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

function NavSidebarItem({ item }: { item: NavItem }) {
    const { hasPermission } = usePermission();
    const { state, isMobile, setOpenMobile } = useSidebar();

    if (item.permission && !hasPermission(item.permission)) {
        return null;
    }

    const Icon = getIcon(item.icon);
    const isActive = item.route ? route().current(item.route) : false;

    if (item.children && item.children.length > 0) {
        const visibleChildren = item.children.filter(
            (child) => !child.permission || hasPermission(child.permission)
        );

        if (visibleChildren.length === 0) return null;

        if (state === 'collapsed' && !isMobile) {
            return (
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip={item.label} isActive={isActive}>
                                {Icon && <Icon />}
                                <span>{item.label}</span>
                                <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" sideOffset={4}>
                            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {visibleChildren.map((sub) => {
                                const SubIcon = getIcon(sub.icon);
                                const subActive = sub.route ? route().current(sub.route) : false;
                                return (
                                    <DropdownMenuItem key={sub.label} asChild>
                                        <Link
                                            href={sub.route ? route(sub.route) : '#'}
                                            className={subActive ? 'bg-secondary' : ''}
                                        >
                                            {SubIcon && <SubIcon />}
                                            <span className="max-w-52 text-wrap">{sub.label}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            );
        }

        return (
            <Collapsible
                asChild
                defaultOpen={visibleChildren.some((c) => c.route && route().current(c.route))}
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label}>
                            {Icon && <Icon />}
                            <span>{item.label}</span>
                            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="CollapsibleContent">
                        <SidebarMenuSub>
                            {visibleChildren.map((sub) => {
                                const SubIcon = getIcon(sub.icon);
                                const subActive = sub.route ? route().current(sub.route) : false;
                                return (
                                    <SidebarMenuSubItem key={sub.label}>
                                        <SidebarMenuSubButton asChild isActive={subActive}>
                                            <Link
                                                href={sub.route ? route(sub.route) : '#'}
                                                onClick={() => setOpenMobile(false)}
                                            >
                                                {SubIcon && <SubIcon />}
                                                <span>{sub.label}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                <Link
                    href={item.route ? route(item.route) : '#'}
                    onClick={() => setOpenMobile(false)}
                >
                    {Icon && <Icon />}
                    <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function NavUser() {
    const { auth } = usePage<PageProps>().props;
    const { isMobile } = useSidebar();

    const initials = auth.user
        ? auth.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <SidebarMenuButton
                        size="lg"
                        asChild
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <DropdownMenuTrigger>
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-start text-sm leading-tight">
                                <span className="truncate font-semibold">{auth.user?.name}</span>
                                <span className="truncate text-xs">{auth.user?.email}</span>
                            </div>
                            <ChevronRight className="ms-auto size-4" />
                        </DropdownMenuTrigger>
                    </SidebarMenuButton>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-semibold">{auth.user?.name}</span>
                                    <span className="truncate text-xs">{auth.user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.visit(route('profile.edit'))}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.post(route('logout'))}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
