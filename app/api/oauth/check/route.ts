import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Check if user has an active OAuth connection for a provider
 * GET /api/oauth/check?provider=spotify
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const provider = searchParams.get("provider")

    if (!provider) {
      return NextResponse.json({ error: "Provider parameter required" }, { status: 400 })
    }

    // Check if user has an active connection for this provider
    const { data: connections, error } = await supabase
      .from("oauth_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("[OAuth Check] Error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const connected = connections && connections.length > 0

    return NextResponse.json({
      connected,
      connection: connected ? connections[0] : null,
    })
  } catch (error: any) {
    console.error("[OAuth Check] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
