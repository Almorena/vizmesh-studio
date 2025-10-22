import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all usage records for user
    const { data: records, error } = await supabase
      .from("api_usage")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("[Usage] Error fetching records:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate summary
    const summary = {
      totalTokens: records?.reduce((sum, r) => sum + r.total_tokens, 0) || 0,
      totalCost: records?.reduce((sum, r) => sum + parseFloat(r.estimated_cost), 0) || 0,
      byProvider: {} as Record<string, { tokens: number; cost: number }>
    }

    records?.forEach((r) => {
      if (!summary.byProvider[r.provider]) {
        summary.byProvider[r.provider] = { tokens: 0, cost: 0 }
      }
      summary.byProvider[r.provider].tokens += r.total_tokens
      summary.byProvider[r.provider].cost += parseFloat(r.estimated_cost)
    })

    return NextResponse.json({ records, summary })
  } catch (error: any) {
    console.error("[Usage] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
