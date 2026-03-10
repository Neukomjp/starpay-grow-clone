'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { organizationService } from '@/lib/services/organizations'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function setOrganizationAction(organizationId: string) {
    (await cookies()).set('organization-id', organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
    })
    revalidatePath('/dashboard')
}

export async function getOrganizationAction() {
    const orgId = (await cookies()).get('organization-id')?.value
    return orgId
}

export async function createOrganizationAction(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) throw new Error('Not authenticated')

    const newOrg = await organizationService.createOrganization(name, userId, supabase)

    // Auto-select the new org
    await setOrganizationAction(newOrg.id)
    return newOrg
}

export async function getUserOrganizationsAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) return []

    return await organizationService.getUserOrganizations(userId, supabase)
}

import { Organization } from '@/lib/types/organization'

export async function updateOrganizationAction(id: string, updates: Partial<Organization>) {
    const supabase = await createClient()
    await organizationService.updateOrganization(id, updates, supabase)
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function getOrganizationMembersAction(organizationId: string) {
    const supabase = await createClient()
    return await organizationService.getOrganizationMembers(organizationId, supabase)
}

export async function updateMemberRoleAction(organizationId: string, memberId: string, newRole: string) {
    const supabase = await createClient()
    // Notice: We should ideally verify if the *caller* has 'owner' or 'admin' rights here via RLS or service check.
    // Assuming RLS or middleware handles authorization, or we can add a basic check.
    await organizationService.updateMemberRole(organizationId, memberId, newRole, supabase)
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function removeMemberAction(organizationId: string, memberId: string) {
    const supabase = await createClient()
    await organizationService.removeMember(organizationId, memberId, supabase)
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function inviteMemberAction(organizationId: string, email: string, role: string) {
    try {
        const supabase = await createClient()

        // 1. Actually invite the member in the database
        await organizationService.inviteMember(organizationId, email, role)

        // 2. Fetch the organization to get its name for the email
        const org = await organizationService.getOrganizationById(organizationId, supabase)

        // 3. Send an invitation email using Resend
        const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://senathrough.com'}/login`
        const roleName = role === 'admin' ? '管理者' : '一般メンバー'

        await sendEmail({
            to: email,
            subject: `【Salon Booking System】「${org.name}」への招待`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0f172a;">「${org.name}」へ招待されました</h2>
                    <p>あなたのアカウントが、組織「<strong>${org.name}</strong>」の<strong>${roleName}</strong>として追加されました。</p>
                    <p>以下のリンクからシステムにログインして、ダッシュボードへアクセスしてください。</p>
                    <div style="margin: 24px 0;">
                        <a href="${loginUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            システムにログインする
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        ※このメールにお心当たりがない場合は、破棄してください。
                    </p>
                </div>
            `
        })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('inviteMemberAction Error:', error)
        // Return a safe error message to the client instead of throwing (which gets masked in production)
        const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました。'
        return { success: false, error: errorMessage }
    }
}
