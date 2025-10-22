"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Home, Loader2, DollarSign, TrendingUp, Activity, BarChart3, LayoutDashboard, Plug, LogOut } from "lucide-react"
import Link from "next/link"
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

export default function UsagePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [groupBy, setGroupBy] = useState<"date" | "provider">("date")
  const [displayLimit, setDisplayLimit] = useState(20)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadUsage()
    }
  }, [user])

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

  // Get unique providers for filter
  const uniqueProviders = Array.from(new Set(records.map(r => r.provider)))

  // Filter records by selected provider
  const filteredRecords = selectedProvider === "all"
    ? records
    : records.filter(r => r.provider === selectedProvider)

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

  const displayRecords = filteredRecords.slice(0, displayLimit)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Navigation Header */}
      <header className="nav-header">
        <div className="container-app">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h2 className="text-xl font-semibold">VizMesh Studio</h2>
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/">
                  <button className="nav-link">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboards
                  </button>
                </Link>
                <Link href="/integrations">
                  <button className="nav-link">
                    <Plug className="h-4 w-4" />
                    Integrations
                  </button>
                </Link>
                <Link href="/usage">
                  <button className="nav-link nav-link-active">
                    <DollarSign className="h-4 w-4" />
                    Usage
                  </button>
                </Link>
              </nav>
            </div>
            <Button variant="ghost" onClick={handleSignOut} size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Minimal */}
      <section className="border-b">
        <div className="container-app py-16">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-5xl font-light tracking-tight mb-4">Usage & Costs</h1>
            <p className="text-lg text-muted-foreground font-light">
              Monitor your API consumption and spending
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container-app py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {loading ? (
            /* Loading Skeletons */
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="skeleton h-4 w-24" />
                        <div className="skeleton h-6 w-6 rounded-full" />
                      </div>
                      <div className="skeleton h-8 w-32" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="skeleton h-6 w-40 mb-6" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Summary Stats Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  <div className="card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">API Requests</h3>
                      <Activity className="h-5 w-5 text-foreground" />
                    </div>
                    <p className="text-3xl font-bold">
                      {records.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total requests made
                    </p>
                  </div>

                  <div className="card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
                      <DollarSign className="h-5 w-5 text-foreground" />
                    </div>
                    <p className="text-3xl font-bold">
                      {formatCost(summary.totalCost)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Estimated spend
                    </p>
                  </div>

                  <div className="card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Providers</h3>
                      <TrendingUp className="h-5 w-5 text-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{Object.keys(summary.byProvider).length}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Active API providers
                    </p>
                  </div>
                </div>
              )}

              {/* Provider Breakdown */}
              {summary && Object.keys(summary.byProvider).length > 0 && (
                <div className="card animate-slide-up">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="h-5 w-5 text-foreground" />
                    <h2 className="text-xl font-semibold">Usage by Provider</h2>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(summary.byProvider).map(([provider, stats]) => {
                      const percentage = summary.totalCost > 0
                        ? (stats.cost / summary.totalCost) * 100
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
            </>
          )}
        </div>
      </main>
    </div>
  )
}
