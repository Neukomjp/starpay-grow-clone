import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span>サロン予約システム</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">ログイン</Button>
          </Link>
          <Link href="/signup">
            <Button>はじめる</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-24 px-6 text-center bg-gray-50">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            サロン予約システムで <br /> ビジネスを加速させる
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Next.jsとSupabaseを活用した、マルチ決済、店舗ページ作成、スタッフ管理のための包括的なプラットフォーム。
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-lg">
                デモを試す <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                アカウント作成
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">店舗ページビルダ</h3>
              <p className="text-gray-600">コーディング不要で、美しくモバイル対応の店舗ページを作成できます。</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">スタッフ管理</h3>
              <p className="text-gray-600">スタッフのプロフィール、シフト、予約を効率的に管理します。</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">マルチ決済対応</h3>
              <p className="text-gray-600">さまざまな決済方法に対応し、売上をリアルタイムで追跡します。</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t">
        © 2024 サロン予約システム. 本システムはデモンストレーション用に構築されています。
      </footer>
    </div>
  )
}
