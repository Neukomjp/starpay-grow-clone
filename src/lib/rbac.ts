import { OrganizationRole } from '@/lib/types/organization'

export const PERMISSIONS = {
    MANAGE_ORGANIZATION: 'manage_organization',
    MANAGE_BILLING: 'manage_billing',
    MANAGE_MEMBERS: 'manage_members',
    CREATE_STORE: 'create_store',
    DELETE_STORE: 'delete_store',
    MANAGE_STORE_SETTINGS: 'manage_store_settings',
    VIEW_DASHBOARD: 'view_dashboard',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
    owner: [
        PERMISSIONS.MANAGE_ORGANIZATION,
        PERMISSIONS.MANAGE_BILLING,
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.CREATE_STORE,
        PERMISSIONS.DELETE_STORE,
        PERMISSIONS.MANAGE_STORE_SETTINGS,
        PERMISSIONS.VIEW_DASHBOARD,
    ],
    admin: [
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.CREATE_STORE,
        PERMISSIONS.MANAGE_STORE_SETTINGS,
        PERMISSIONS.VIEW_DASHBOARD,
    ],
    member: [
        PERMISSIONS.VIEW_DASHBOARD,
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
