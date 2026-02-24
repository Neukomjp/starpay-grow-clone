import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default async function ThanksPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    const slug = params.slug
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">予約が完了しました</h1>

                <p className="text-gray-600">
                    ご予約ありがとうございます。<br />
                    確認メールを送信いたしましたのでご確認ください。
                </p>

                <div className="pt-4">
                    <Button asChild className="w-full">
                        <Link href={`/store/${params.slug}`}>
                            店舗トップへ戻る
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
