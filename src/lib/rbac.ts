import { OrganizationRole } from '@/lib/types/organization'

export const PERMISSIONS = {
    MANAGE_ORGANIZATION: 'manage_organization',
    MANAGE_BILLING: 'manage_billing',
    MANAGE_MEMBERS: 'manage_members',
    CREATE_STORE: 'create_store',
    DELETE_STORE: 'delete_store',
    MANAGE_STORE_SETTINGS: 'manage_store_settings',
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_STORES: 'view_stores',
    VIEW_CUSTOMERS: 'view_customers',
    VIEW_COUPONS: 'view_coupons',
    VIEW_PAYMENTS: 'view_payments',
    MANAGE_SETTINGS: 'manage_settings',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
    owner: Object.values(PERMISSIONS), // Owner gets everything
    admin: [
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.CREATE_STORE,
        PERMISSIONS.MANAGE_STORE_SETTINGS,
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_STORES,
        PERMISSIONS.VIEW_CUSTOMERS,
        PERMISSIONS.VIEW_COUPONS,
        PERMISSIONS.VIEW_PAYMENTS,
        PERMISSIONS.MANAGE_SETTINGS,
    ],
    member: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CUSTOMERS,
        PERMISSIONS.VIEW_COUPONS,
    ],
}

export function hasPermission(role: OrganizationRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

export function canCreateStore(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.CREATE_STORE)
}

export function canManageBilling(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.MANAGE_BILLING)
}

export function canManageMembers(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.MANAGE_MEMBERS)
}

export function canViewStores(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.VIEW_STORES)
}

export function canViewCustomers(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.VIEW_CUSTOMERS)
}

export function canViewCoupons(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.VIEW_COUPONS)
}

export function canViewPayments(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.VIEW_PAYMENTS)
}

export function canManageSettings(role: OrganizationRole): boolean {
    return hasPermission(role, PERMISSIONS.MANAGE_SETTINGS)
}
