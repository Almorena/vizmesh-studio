import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  console.log("🔐 Auth callback triggered")
  console.log("📍 Request URL:", requestUrl.toString())
  console.log("🔑 Code:", code)

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      console.log("✅ Exchange result:", { hasSession: !!data.session, error })

      if (error) {
        console.error("❌ Exchange error:", error)
        // Redirect to auth page with error
        return NextResponse.redirect(new URL("/auth?error=auth_failed", requestUrl.origin))
      }
    } catch (err) {
      console.error("❌ Callback error:", err)
      return NextResponse.redirect(new URL("/auth?error=callback_failed", requestUrl.origin))
    }
  } else {
    console.log("⚠️ No code provided")
  }

  console.log("🏠 Redirecting to home")
  // Redirect to home page after successful login
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
