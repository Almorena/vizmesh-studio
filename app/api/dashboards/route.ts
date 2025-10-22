import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getClientIdFromRequest, verifyClientAccess } from "@/lib/client/verify-client-access"

/**
 * GET /api/dashboards - List all dashboards for current user and client
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(req)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    // Get all dashboards for user and client
    const { data: dashboards, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[Dashboards] Error fetching dashboards:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ dashboards })
  } catch (error: any) {
    console.error("[Dashboards] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboards - Create a new dashboard
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(req)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Create dashboard with client_id
    const { data: dashboard, error } = await supabase
      .from("dashboards")
      .insert({
        user_id: user.id,
        client_id: clientId,
        name,
        description: description || null
      })
      .select()
      .single()

    if (error) {
      console.error("[Dashboards] Error creating dashboard:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ dashboard })
  } catch (error: any) {
    console.error("[Dashboards] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
