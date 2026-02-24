import { NextResponse } from 'next/server'
// The client you created from the Server-Side Supabase doc
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Remove "demo-session" cookie just in case it's lingering
            const response = NextResponse.redirect(`${origin}${next}`)
            response.cookies.delete('demo-session')
            response.cookies.delete('demo-user-email')
            return response
        }
    }

    // return the user to an error page with instructions
    // TODO: Create a proper error page if needed, for now redirect back to login
    return NextResponse.redirect(`${origin}/login?error=auth-error`)
}
