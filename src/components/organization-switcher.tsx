'use client'

import React, { useEffect, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Organization } from '@/lib/types/organization'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { setOrganizationAction, createOrganizationAction, getUserOrganizationsAction } from '@/lib/actions/organization'

export function OrganizationSwitcher({ currentOrgId }: { currentOrgId?: string }) {
    const [orgs, setOrgs] = useState<(Organization & { role: string })[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>(currentOrgId || '')
    const [loading, setLoading] = useState(true)
    const [newOrgName, setNewOrgName] = useState('')
    const [open, setOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        loadOrgs()
    }, [])

    const loadOrgs = async () => {
        try {
            const data = await getUserOrganizationsAction()
            setOrgs(data)
            if (data.length > 0) {
                // If no org is currently selected (stored in cookie), select the first one and set the cookie
                if (!currentOrgId) {
                    const defaultOrgId = data[0].id
                    setSelectedOrgId(defaultOrgId)
                    // We need to set the cookie. We can reuse setOrganizationAction
                    await setOrganizationAction(defaultOrgId)
                } else {
                    // Ensure state matches prop if provided
                    setSelectedOrgId(currentOrgId)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleOrgChange = async (value: string) => {
        setLoading(true)
        setSelectedOrgId(value)
        try {
            await setOrganizationAction(value)
            toast.info('Organization switched')
            // Optional: force refresh if needed, but revalidatePath should handle it
            router.refresh()
        } catch (e) {
            console.error(e)
            toast.error('Failed to switch organization')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) return

        try {
            const newOrg = await createOrganizationAction(newOrgName)
            setOrgs([...orgs, { ...newOrg, role: 'owner' }])
            setSelectedOrgId(newOrg.id)
            setOpen(false)
            setNewOrgName('')
            toast.success('組織を作成しました')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('作成に失敗しました')
        }
    }

    if (loading) return <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />

    return (
        <div className="w-full">
            <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Organization
            </div>
            <div className="flex gap-2 items-center">
                <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-4 w-4" />
                            <SelectValue placeholder="Select Organization" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {orgs.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                                {org.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" title="Create Organization">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新しい組織を作成</DialogTitle>
                            <DialogDescription>
                                会社やチームの単位で組織を作成します。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">組織名 (会社名)</Label>
                                <Input
                                    id="name"
                                    value={newOrgName}
                                    onChange={(e) => setNewOrgName(e.target.value)}
                                    placeholder="株式会社Example"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateOrg}>作成</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="px-2 mt-1 text-xs text-gray-400">
                {orgs.find(o => o.id === selectedOrgId)?.role === 'owner' ? 'Owner' : 'Member'}
            </div>
        </div>
    )
}
