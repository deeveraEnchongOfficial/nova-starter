import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    roles: string[];
    permissions: string[];
}

export interface NavItem {
    label: string;
    route: string | null;
    icon: string | null;
    permission: string | null;
    children?: NavItem[] | null;
}

export interface Module {
    enabled: boolean;
    label: string;
    icon: string;
    route: string;
    permission: string;
}

export interface Branding {
    name: string;
    short_name: string;
    tagline: string;
    logo: string | null;
    logo_dark: string | null;
    favicon: string | null;
    theme: {
        default_mode: 'light' | 'dark' | 'system';
        primary_color: string;
        radius: string;
    };
    layout: {
        sidebar_collapsible: boolean;
        sidebar_default_open: boolean;
        header_sticky: boolean;
    };
}

export interface Features {
    multi_tenant: boolean;
    user_registration: boolean;
    password_reset: boolean;
    email_verification: boolean;
    two_factor_auth: boolean;
    user_profile_edit: boolean;
    account_deletion: boolean;
    api_tokens: boolean;
    dark_mode: boolean;
    [key: string]: boolean;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    branding: Branding;
    navigation: NavItem[];
    modules: Record<string, Module>;
    features: Features;
    ziggy: Config & { location: string };
};
