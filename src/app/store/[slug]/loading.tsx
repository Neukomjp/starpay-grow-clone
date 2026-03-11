import { Skeleton } from "@/components/ui/skeleton"

export default function StoreLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 fade-in">
            {/* Store Header Skeleton */}
            <div className="relative h-48 md:h-64 bg-slate-200">
                 <Skeleton className="absolute inset-0 w-full h-full" />
                 <div className="absolute inset-0 bg-black/40" />
                 <div className="absolute bottom-4 left-4 right-4 text-white">
                      <Skeleton className="h-8 w-64 mb-2 bg-white/50" />
                      <Skeleton className="h-4 w-48 bg-white/50" />
                 </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Store Info Skeleton */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
                   <div className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                   </div>
                </div>

                {/* Booking Section Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                    <Skeleton className="h-8 w-48 mx-auto mb-4" />
                    <Skeleton className="h-4 w-64 mx-auto mb-6" />
                    <Skeleton className="h-12 w-48 mx-auto rounded-md" />
                </div>
            </div>
        </div>
    )
}
