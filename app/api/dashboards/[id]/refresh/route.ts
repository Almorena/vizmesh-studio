import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/dashboards/[id]/refresh - Refresh all widget data for a dashboard
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: dashboardId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get all widgets for this dashboard
    const { data: widgets, error: widgetsError } = await supabase
      .from("widgets")
      .select("*")
      .eq("dashboard_id", dashboardId)

    if (widgetsError) {
      console.error("[Dashboard Refresh] Error fetching widgets:", widgetsError)
      return NextResponse.json({ error: widgetsError.message }, { status: 500 })
    }

    if (!widgets || widgets.length === 0) {
      return NextResponse.json({
        message: "No widgets to refresh",
        refreshedAt: new Date().toISOString()
      })
    }

    console.log(`[Dashboard Refresh] Refreshing ${widgets.length} widgets for dashboard ${dashboardId}`)

    // Fetch and cache data for each widget
    const results = await Promise.allSettled(
      widgets.map(async (widget) => {
        try {
          // Fetch data from the data source
          const fetchResponse = await fetch(`${req.nextUrl.origin}/api/fetch-data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": req.headers.get("cookie") || ""
            },
            body: JSON.stringify({
              sourceId: widget.data_source.config?.sourceId,
              endpoint: widget.data_source.config?.endpoint || "",
              params: widget.data_source.config?.params || {}
            })
          })

          if (!fetchResponse.ok) {
            const error = await fetchResponse.json()
            throw new Error(error.error || "Failed to fetch data")
          }

          const { data } = await fetchResponse.json()

          // Upsert data into cache
          const { error: upsertError } = await supabase
            .from("widget_data_cache")
            .upsert({
              widget_id: widget.id,
              data: data,
              updated_at: new Date().toISOString()
            }, {
              onConflict: "widget_id"
            })

          if (upsertError) {
            console.error(`[Dashboard Refresh] Error caching data for widget ${widget.id}:`, upsertError)
            throw upsertError
          }

          console.log(`[Dashboard Refresh] Cached data for widget ${widget.id}`)
          return { widgetId: widget.id, success: true }
        } catch (error: any) {
          console.error(`[Dashboard Refresh] Error refreshing widget ${widget.id}:`, error)
          return { widgetId: widget.id, success: false, error: error.message }
        }
      })
    )

    // Count successes and failures
    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length
    const failed = results.length - successful

    console.log(`[Dashboard Refresh] Completed: ${successful} succeeded, ${failed} failed`)

    return NextResponse.json({
      message: "Dashboard refreshed",
      refreshedAt: new Date().toISOString(),
      stats: {
        total: widgets.length,
        successful,
        failed
      }
    })
  } catch (error: any) {
    console.error("[Dashboard Refresh] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
