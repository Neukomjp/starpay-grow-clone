import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function MyPageLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>

                <div className="space-y-4">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-40 mt-2" />
                            </CardHeader>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-40 mt-2" />
                            </CardHeader>
                        </Card>
                    </div>
                </div>

                <div className="space-y-4">
                    <Skeleton className="h-6 w-32 mb-4" />
                    
                    <Card className="overflow-hidden">
                        <div className="border-l-4 border-gray-200 h-full">
                            <CardHeader className="bg-gray-50/50 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 grid gap-3">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-6 w-24 ml-auto" />
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
