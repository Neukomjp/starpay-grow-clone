import { notFound } from 'next/navigation'
import { storeService } from '@/lib/services/stores'
import { StoreEditorTabs } from './store-editor-tabs'
import { cookies } from 'next/headers'

interface StoreEditorPageProps {
    params: Promise<{
        id: string
    }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StoreEditorPage({ params, searchParams }: StoreEditorPageProps) {
    const { id } = await params
    const { tab } = await searchParams

    const cookieStore = await cookies()
    const organizationId = cookieStore.get('organization-id')?.value
    let store

    try {
        store = await storeService.getStoreById(id, organizationId)
    } catch (error) {
        console.error('Error fetching store:', error)
        notFound()
    }

    if (!store) {
        notFound()
    }

    return <StoreEditorTabs store={store} initialTab={typeof tab === 'string' ? tab : undefined} />
}
