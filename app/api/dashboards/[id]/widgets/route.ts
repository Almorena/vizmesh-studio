import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/dashboards/[id]/widgets - Get all widgets for a dashboard
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: dashboardId } = await params

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

    // Get all widgets for dashboard with cached data
    const { data: widgets, error } = await supabase
      .from("widgets")
      .select(`
        *,
        widget_data_cache (
          data,
          updated_at
        )
      `)
      .eq("dashboard_id", dashboardId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Widgets] Error fetching widgets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform widgets to include cached_data at the top level
    const widgetsWithCache = widgets?.map(widget => {
      const cache = Array.isArray(widget.widget_data_cache)
        ? widget.widget_data_cache[0]
        : widget.widget_data_cache

      console.log(`[Widgets API] Widget ${widget.id}:`, {
        hasCache: !!cache,
        cacheDataType: cache?.data ? (Array.isArray(cache.data) ? 'array' : typeof cache.data) : 'none',
        cacheDataLength: Array.isArray(cache?.data) ? cache.data.length : 'n/a',
        cacheDataKeys: cache?.data && typeof cache.data === 'object' && !Array.isArray(cache.data)
          ? Object.keys(cache.data).slice(0, 5)
          : null
      })

      return {
        ...widget,
        cached_data: cache?.data || null,
        cache_updated_at: cache?.updated_at || null,
        widget_data_cache: undefined // Remove the nested structure
      }
    })

    console.log(`[Widgets API] Returning ${widgetsWithCache?.length || 0} widgets`)
    return NextResponse.json({ widgets: widgetsWithCache })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: dashboardId } = await params
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
 * PATCH /api/dashboards/[id]/widgets - Update a widget
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

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

    const body = await req.json()
    const { column_span, title, visualization, data_source } = body

    if (column_span !== undefined && ![1, 2, 3].includes(column_span)) {
      return NextResponse.json(
        { error: "Column span must be 1, 2, or 3" },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (column_span !== undefined) updateData.column_span = column_span
    if (title !== undefined) updateData.title = title
    if (visualization !== undefined) updateData.visualization = visualization
    if (data_source !== undefined) updateData.data_source = data_source

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Update widget (RLS will ensure user owns it)
    const { data: widget, error } = await supabase
      .from("widgets")
      .update(updateData)
      .eq("id", widgetId)
      .select()
      .single()

    if (error) {
      console.error("[Widgets] Error updating widget:", error)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params
    const supabase = await createClient()

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
