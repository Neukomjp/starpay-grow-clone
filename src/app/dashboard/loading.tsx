import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="p-6 pt-0">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-[400px] w-full rounded-md" />
                    </div>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Skeleton className="h-32 w-full rounded-xl" />
                 <Skeleton className="h-32 w-full rounded-xl" />
                 <Skeleton className="h-32 w-full rounded-xl" />
                 <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        </div>
    )
}
