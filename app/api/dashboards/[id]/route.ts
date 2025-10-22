import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getClientIdFromRequest, verifyClientAccess } from "@/lib/client/verify-client-access"

// GET /api/dashboards/[id] - Get dashboard details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(request)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    // Get dashboard with client_id filter
    const { data: dashboard, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("id", id)
      .eq("client_id", clientId)
      .single()

    if (error) {
      console.error("[API] Error fetching dashboard:", error)
      return NextResponse.json(
        { error: "Failed to fetch dashboard" },
        { status: 500 }
      )
    }

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error("[API] Error in GET /api/dashboards/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/dashboards/[id] - Update dashboard (name and/or theme)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(request)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    const body = await request.json()
    const { name, theme } = body

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updates.name = name
    }

    if (theme !== undefined) {
      // Validate theme
      if (!['modern', 'neutral', 'dark'].includes(theme)) {
        return NextResponse.json(
          { error: "Invalid theme. Must be 'modern', 'neutral', or 'dark'" },
          { status: 400 }
        )
      }
      updates.theme = theme
    }

    // Update dashboard with client_id filter
    const { data, error } = await supabase
      .from("dashboards")
      .update(updates)
      .eq("id", id)
      .eq("client_id", clientId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating dashboard:", error)
      return NextResponse.json(
        { error: "Failed to update dashboard" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in PATCH /api/dashboards/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboards/[id] - Delete dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(request)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    // Delete dashboard with client_id filter
    const { error } = await supabase
      .from("dashboards")
      .delete()
      .eq("id", id)
      .eq("client_id", clientId)

    if (error) {
      console.error("[API] Error deleting dashboard:", error)
      return NextResponse.json(
        { error: "Failed to delete dashboard" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error in DELETE /api/dashboards/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
