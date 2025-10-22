import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { isFreAPI } from "@/lib/utils/api-usage"

/**
 * Clean Free APIs from Usage Tracking
 * Removes records for free APIs that were mistakenly tracked
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Clean Free APIs] Starting cleanup for user:", user.id)

    // List of free API providers to remove
    const freeProviders = [
      'nextatlas',
      'spotify',
      'lastfm',
      'last.fm',
      'jsonplaceholder',
      'github'
    ]

    // First, fetch all records for this user
    const { data: allRecords, error: fetchError } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error("[Clean Free APIs] Error fetching records:", fetchError)
      throw fetchError
    }

    console.log(`[Clean Free APIs] Found ${allRecords?.length || 0} total records`)

    // Filter records that match free APIs (case-insensitive)
    const recordsToDelete = (allRecords || []).filter(record => {
      const model = (record.model || '').toLowerCase()
      const provider = (record.provider || '').toLowerCase()

      return freeProviders.some(freeApi =>
        model.includes(freeApi.toLowerCase()) || provider.includes(freeApi.toLowerCase())
      )
    })

    console.log(`[Clean Free APIs] Found ${recordsToDelete.length} records to delete`)
    console.log(`[Clean Free APIs] Records to delete:`, recordsToDelete.map(r => ({ model: r.model, provider: r.provider })))

    // Delete records by ID
    let deletedCount = 0
    for (const record of recordsToDelete) {
      const { error: deleteError } = await supabase
        .from('api_usage')
        .delete()
        .eq('id', record.id)

      if (!deleteError) {
        deletedCount++
      } else {
        console.error(`[Clean Free APIs] Error deleting record ${record.id}:`, deleteError)
      }
    }

    console.log(`[Clean Free APIs] Successfully deleted ${deletedCount} records`)

    // Get updated summary
    const { data: remainingRecords, error: fetchRemainingError } = await supabase
      .from('api_usage')
      .select('provider, model, estimated_cost')
      .eq('user_id', user.id)

    if (fetchRemainingError) {
      console.error("[Clean Free APIs] Error fetching remaining records:", fetchRemainingError)
    }

    const summary = remainingRecords?.reduce((acc, record) => {
      if (!acc[record.provider]) {
        acc[record.provider] = { count: 0, cost: 0 }
      }
      acc[record.provider].count++
      acc[record.provider].cost += parseFloat(record.estimated_cost || '0')
      return acc
    }, {} as Record<string, { count: number; cost: number }>)

    return NextResponse.json({
      success: true,
      deletedCount,
      remainingSummary: summary || {}
    })
  } catch (error: any) {
    console.error("[Clean Free APIs] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to clean free API records" },
      { status: 500 }
    )
  }
}
