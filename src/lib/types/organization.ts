export type OrganizationRole = 'owner' | 'admin' | 'member'

export type Organization = {
    id: string
    name: string
    slug: string
    plan: 'free' | 'starter' | 'pro' | 'enterprise'
    custom_domain?: string
    is_white_labeled: boolean
    branding: {
        logo_url?: string
        favicon_url?: string
        primary_color?: string
        remove_branding?: boolean
    }
    created_at: string
    updated_at: string
}

export type OrganizationMember = {
    id: string
    organization_id: string
    user_id: string
    role: OrganizationRole
    joined_at: string
}
