'use client'

import { useState, useEffect } from 'react'
import { Organization, OrganizationRole } from '@/lib/types/organization'
import { getOrganizationAction, getUserOrganizationsAction } from '@/lib/actions/organization'

export function useCurrentOrganization() {
    const [organization, setOrganization] = useState<(Organization & { role: OrganizationRole }) | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadOrg()
    }, [])

    const loadOrg = async () => {
        try {
            const currentOrgId = await getOrganizationAction()
            const orgs = await getUserOrganizationsAction()

            if (currentOrgId) {
                const found = orgs.find(o => o.id === currentOrgId)
                if (found) {
                    setOrganization(found as (Organization & { role: OrganizationRole }))
                } else if (orgs.length > 0) {
                    // Fallback
                    setOrganization(orgs.find(o => o.id === '11111111-1111-1111-1111-111111111111') as (Organization & { role: OrganizationRole }) || orgs[0] as (Organization & { role: OrganizationRole }))
                }
            } else if (orgs.length > 0) {
                setOrganization(orgs[0] as (Organization & { role: OrganizationRole }))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return { organization, loading }
}
