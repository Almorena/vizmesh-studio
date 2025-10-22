"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, TrendingUp, Activity, BarChart3, Trash2 } from "lucide-react"
import { formatCost, formatTokens } from "@/lib/utils/api-usage"

interface UsageRecord {
  id: string
  provider: string
  model: string
  endpoint: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost: number
  created_at: string
}

interface UsageSummary {
  totalTokens: number
  totalCost: number
  byProvider: Record<string, { tokens: number; cost: number }>
}

type TimePeriod = "today" | "week" | "month" | "6months" | "year" | "all"

export function UsageHistory() {
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("all")
  const [groupBy, setGroupBy] = useState<"date" | "provider">("date")
  const [displayLimit, setDisplayLimit] = useState(20)

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/usage")

      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
        setSummary(data.summary || null)
      }
    } catch (error) {
      console.error("Error loading usage:", error)
    } finally {
      setLoading(false)
    }
  }

  const cleanFreeAPIs = async () => {
    if (!confirm("Vuoi rimuovere tutti i record delle API gratuite (Nextatlas, Spotify, Last.fm, etc.)? Questa azione non può essere annullata.")) {
      return
    }

    try {
      setCleaning(true)
      const response = await fetch("/api/usage/clean-free-apis", {
        method: "POST"
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Cleaned free APIs:", data)
        alert(`✅ ${data.deletedCount} record eliminati con successo!`)
        // Reload usage data
        await loadUsage()
      } else {
        const error = await response.json()
        alert(`❌ Errore: ${error.error}`)
      }
    } catch (error) {
      console.error("Error cleaning free APIs:", error)
      alert("❌ Errore durante la pulizia")
    } finally {
      setCleaning(false)
    }
  }

  // Get unique providers for filter
  const uniqueProviders = Array.from(new Set(records.map(r => r.provider)))

  // Helper: Get date range for period
  const getDateRangeForPeriod = (period: TimePeriod): Date | null => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (period) {
      case "today":
        return today
      case "week":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return weekAgo
      case "month":
        const monthAgo = new Date(today)
        monthAgo.setDate(monthAgo.getDate() - 30)
        return monthAgo
      case "6months":
        const sixMonthsAgo = new Date(today)
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        return sixMonthsAgo
      case "year":
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return yearAgo
      case "all":
      default:
        return null
    }
  }

  // Filter records by time period and provider (with useMemo for performance)
  const filteredRecords = useMemo(() => {
    const cutoffDate = getDateRangeForPeriod(selectedPeriod)

    // Log date range of records
    if (records.length > 0) {
      const dates = records.map(r => new Date(r.created_at).getTime()).sort((a, b) => a - b)
      const oldest = new Date(dates[0])
      const newest = new Date(dates[dates.length - 1])
      console.log(`[UsageHistory] Records date range: ${oldest.toISOString()} to ${newest.toISOString()}`)
    }

    console.log(`[UsageHistory] Filtering - Period: ${selectedPeriod}, Cutoff: ${cutoffDate?.toISOString()}, Total records: ${records.length}`)

    const filtered = records.filter(record => {
      // Filter by provider
      const providerMatch = selectedProvider === "all" || record.provider === selectedProvider

      // Filter by time period
      const timeMatch = !cutoffDate || new Date(record.created_at) >= cutoffDate

      return providerMatch && timeMatch
    })

    console.log(`[UsageHistory] Filtered to ${filtered.length} records`)
    return filtered
  }, [records, selectedProvider, selectedPeriod])

  // Calculate summary for filtered records (with useMemo for performance)
  const filteredSummary = useMemo(() => {
    const totalTokens = filteredRecords.reduce((sum, r) => sum + r.total_tokens, 0)
    const totalCost = filteredRecords.reduce((sum, r) => sum + parseFloat(r.estimated_cost.toString()), 0)

    console.log(`[UsageHistory] Summary - Tokens: ${totalTokens}, Cost: $${totalCost.toFixed(4)}`)

    return {
      totalTokens,
      totalCost,
      byProvider: filteredRecords.reduce((acc, r) => {
        if (!acc[r.provider]) {
          acc[r.provider] = { tokens: 0, cost: 0 }
        }
        acc[r.provider].tokens += r.total_tokens
        acc[r.provider].cost += parseFloat(r.estimated_cost.toString())
        return acc
      }, {} as Record<string, { tokens: number; cost: number }>)
    }
  }, [filteredRecords])

  // Period labels
  const periodLabels: Record<TimePeriod, string> = {
    today: "Oggi",
    week: "Ultimi 7 giorni",
    month: "Ultimi 30 giorni",
    "6months": "Ultimi 6 mesi",
    year: "Ultimo anno",
    all: "Tutto"
  }

  // Group records by date or provider
  const groupedRecords = () => {
    if (groupBy === "provider") {
      // Group by provider
      const groups: Record<string, UsageRecord[]> = {}
      filteredRecords.forEach(record => {
        if (!groups[record.provider]) {
          groups[record.provider] = []
        }
        groups[record.provider].push(record)
      })
      return groups
    } else {
      // Group by date
      const groups: Record<string, UsageRecord[]> = {
        "Today": [],
        "Yesterday": [],
        "This Week": [],
        "This Month": [],
        "Older": []
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      filteredRecords.forEach(record => {
        const recordDate = new Date(record.created_at)

        if (recordDate >= today) {
          groups["Today"].push(record)
        } else if (recordDate >= yesterday) {
          groups["Yesterday"].push(record)
        } else if (recordDate >= weekAgo) {
          groups["This Week"].push(record)
        } else if (recordDate >= monthAgo) {
          groups["This Month"].push(record)
        } else {
          groups["Older"].push(record)
        }
      })

      // Remove empty groups
      Object.keys(groups).forEach(key => {
        if (groups[key].length === 0) {
          delete groups[key]
        }
      })

      return groups
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Time Period Selector + Clean Button */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Usage Statistics</h2>
          <p className="text-sm text-muted-foreground">
            {selectedPeriod === "all" ? "All time" : periodLabels[selectedPeriod]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Clean Free APIs Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={cleanFreeAPIs}
            disabled={cleaning}
            className="gap-2"
          >
            {cleaning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Pulizia...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Rimuovi API Gratuite
              </>
            )}
          </Button>

          {/* Time Period Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(["today", "week", "month", "6months", "year", "all"] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">API Requests</h3>
              <Activity className="h-5 w-5 text-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {filteredRecords.length}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedPeriod === "all" ? "Total requests made" : `Requests in ${periodLabels[selectedPeriod].toLowerCase()}`}
            </p>
          </div>

          <div className="card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Tokens</h3>
              <TrendingUp className="h-5 w-5 text-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {formatTokens(filteredSummary.totalTokens)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedPeriod === "all" ? "Total tokens used" : `Tokens in ${periodLabels[selectedPeriod].toLowerCase()}`}
            </p>
          </div>

          <div className="card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
              <DollarSign className="h-5 w-5 text-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {formatCost(filteredSummary.totalCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedPeriod === "all" ? "Total estimated spend" : `Spend in ${periodLabels[selectedPeriod].toLowerCase()}`}
            </p>
          </div>
        </div>
      )}

      {/* Provider Breakdown */}
      {summary && Object.keys(filteredSummary.byProvider).length > 0 && (
        <div className="card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-5 w-5 text-foreground" />
            <h2 className="text-xl font-semibold">Usage by Provider</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(filteredSummary.byProvider)
              .sort(([, a], [, b]) => b.cost - a.cost) // Sort by cost descending
              .map(([provider, stats]) => {
                const percentage = filteredSummary.totalCost > 0
                  ? (stats.cost / filteredSummary.totalCost) * 100
                  : 0

                return (
                  <div key={provider} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="badge badge-primary capitalize">{provider}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTokens(stats.tokens)} tokens
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCost(stats.cost)}</p>
                        <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Usage History Table */}
      <div className="card animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-foreground" />
            <h2 className="text-xl font-semibold">Usage History</h2>
          </div>

          {/* Filter Controls */}
          {records.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Provider Filter */}
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                <option value="all">All Providers</option>
                {uniqueProviders.map(provider => (
                  <option key={provider} value={provider} className="capitalize">
                    {provider}
                  </option>
                ))}
              </select>

              {/* Group By Toggle */}
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <button
                  onClick={() => setGroupBy("date")}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    groupBy === "date"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/30"
                  }`}
                >
                  By Date
                </button>
                <button
                  onClick={() => setGroupBy("provider")}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    groupBy === "provider"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/30"
                  }`}
                >
                  By Provider
                </button>
              </div>
            </div>
          )}
        </div>

        {records.length === 0 ? (
          /* Empty State */
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="empty-state-title">No API usage yet</h3>
              <p className="empty-state-description">
                Start creating AI-powered widgets to see usage data and cost tracking
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRecords()).map(([groupName, groupRecords]) => (
              <div key={groupName} className="space-y-3">
                {/* Group Header */}
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {groupName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {groupRecords.length} {groupRecords.length === 1 ? 'request' : 'requests'}
                  </span>
                </div>

                {/* Compact List View */}
                <div className="space-y-2">
                  {groupRecords.slice(0, displayLimit).map((record) => (
                    <div
                      key={record.id}
                      className="group flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Time */}
                        <div className="text-xs text-muted-foreground w-16">
                          {new Date(record.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Provider Badge */}
                        <span className="badge badge-primary capitalize text-xs">
                          {record.provider}
                        </span>

                        {/* Model & Endpoint */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{record.model}</span>
                          <span className="text-xs text-muted-foreground truncate">{record.endpoint}</span>
                        </div>

                        {/* Usage */}
                        <div className="text-right min-w-[100px]">
                          {record.provider === 'third-party' ? (
                            <span className="text-sm font-medium">1 request</span>
                          ) : (
                            <>
                              <div className="text-sm font-medium">
                                {formatTokens(record.total_tokens)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatTokens(record.input_tokens)} / {formatTokens(record.output_tokens)}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Cost */}
                        <div className="text-right min-w-[80px]">
                          <span className="text-sm font-bold">
                            {formatCost(record.estimated_cost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {filteredRecords.length > displayLimit && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDisplayLimit(prev => prev + 20)}
                  className="gap-2"
                >
                  Load More
                  <span className="text-xs text-muted-foreground">
                    ({filteredRecords.length - displayLimit} remaining)
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
