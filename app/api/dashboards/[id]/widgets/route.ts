import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * GET /api/dashboards/[id]/widgets - Get all widgets for a dashboard
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dashboardId = params.id

    // Verify user owns this dashboard
    const { data: dashboard, error: dashError } = await supabase
      .from("dashboards")
      .select("id")
      .eq("id", dashboardId)
      .eq("user_id", user.id)
      .single()

    if (dashError || !dashboard) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
    }

    // Get all widgets for dashboard
    const { data: widgets, error } = await supabase
      .from("widgets")
      .select("*")
      .eq("dashboard_id", dashboardId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Widgets] Error fetching widgets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ widgets })
  } catch (error: any) {
    console.error("[Widgets] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboards/[id]/widgets - Create a widget in a dashboard
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dashboardId = params.id
    const body = await req.json()
    const { prompt, title, dataSource, visualization, position, size } = body

    if (!prompt || !title || !dataSource || !visualization) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify user owns this dashboard
    const { data: dashboard, error: dashError } = await supabase
      .from("dashboards")
      .select("id")
      .eq("id", dashboardId)
      .eq("user_id", user.id)
      .single()

    if (dashError || !dashboard) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
    }

    // Create widget
    const { data: widget, error } = await supabase
      .from("widgets")
      .insert({
        dashboard_id: dashboardId,
        prompt,
        title,
        data_source: dataSource,
        visualization,
        position: position || { x: 0, y: 0 },
        size: size || { width: 400, height: 300 }
      })
      .select()
      .single()

    if (error) {
      console.error("[Widgets] Error creating widget:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ widget })
  } catch (error: any) {
    console.error("[Widgets] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dashboards/[id]/widgets - Delete a widget
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const widgetId = searchParams.get("widgetId")

    if (!widgetId) {
      return NextResponse.json(
        { error: "Widget ID required" },
        { status: 400 }
      )
    }

    // Delete widget (RLS will ensure user owns it)
    const { error } = await supabase
      .from("widgets")
      .delete()
      .eq("id", widgetId)

    if (error) {
      console.error("[Widgets] Error deleting widget:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Widgets] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
