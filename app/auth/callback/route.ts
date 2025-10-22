import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Auth exchange error:", error)
        return NextResponse.redirect(new URL("/auth?error=auth_failed", requestUrl.origin))
      }
    } catch (err) {
      console.error("Auth callback error:", err)
      return NextResponse.redirect(new URL("/auth?error=callback_failed", requestUrl.origin))
    }
  }

  // Redirect to home page after successful login
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
