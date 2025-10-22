"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useClient } from "@/lib/client/client-context"
import { getWithClient, postWithClient } from "@/lib/client/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight, Plus, Grid3x3 } from "lucide-react"
import Link from "next/link"
import { AppHeader } from "@/components/layout/app-header"

interface Dashboard {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { activeClient, loading: clientLoading } = useClient()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState("")
  const [newDashboardDesc, setNewDashboardDesc] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && activeClient) {
      loadDashboards()
    }
  }, [user, activeClient])

  const loadDashboards = async () => {
    if (!activeClient) return

    try {
      setLoading(true)
      const response = await getWithClient("/api/dashboards", activeClient.id)

      if (response.ok) {
        const data = await response.json()
        setDashboards(data.dashboards || [])
      }
    } catch (error) {
      console.error("Error loading dashboards:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim() || !activeClient) return

    try {
      setCreating(true)
      const response = await postWithClient(
        "/api/dashboards",
        {
          name: newDashboardName,
          description: newDashboardDesc || null
        },
        activeClient.id
      )

      if (!response.ok) {
        throw new Error("Failed to create dashboard")
      }

      const { dashboard } = await response.json()
      router.push(`/dashboard/${dashboard.id}`)
    } catch (error) {
      console.error("Error creating dashboard:", error)
      alert("Failed to create dashboard")
    } finally {
      setCreating(false)
      setModalOpen(false)
      setNewDashboardName("")
      setNewDashboardDesc("")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (authLoading || !user || clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </div>
    )
  }

  if (!activeClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No client selected or no clients available</p>
          <p className="text-sm text-muted-foreground">Please contact your administrator to get access to a client</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero Section - Minimal */}
      <section className="border-b">
        <div className="container-app py-24">
          <div className="max-w-4xl animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-light tracking-tight mb-6">
              VizMesh Studio
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              Create AI-powered data visualizations in seconds
            </p>
          </div>
        </div>
      </section>

      {/* Main Dashboards Section */}
      <main className="container-app py-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Your Dashboards</h2>
              <p className="text-muted-foreground mt-1">
                {dashboards.length === 0
                  ? "Get started by creating your first dashboard"
                  : `${dashboards.length} dashboard${dashboards.length !== 1 ? "s" : ""} • Updated ${new Date().toLocaleDateString()}`
                }
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Dashboard
            </Button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="space-y-4">
                    <div className="skeleton h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <div className="skeleton h-6 w-3/4" />
                      <div className="skeleton h-4 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : dashboards.length === 0 ? (
            /* Empty State */
            <div className="empty-state animate-scale-in">
              <div className="empty-state-icon">
                <Grid3x3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="empty-state-title">No dashboards yet</h3>
                <p className="empty-state-description">
                  Create your first dashboard to start building beautiful data visualizations
                </p>
              </div>
              <Button onClick={() => setModalOpen(true)} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Dashboard
              </Button>
            </div>
          ) : (
            /* Dashboard Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                  className="card-interactive group text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Grid3x3 className="h-6 w-6 text-foreground" />
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{dashboard.name}</h3>
                    {dashboard.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dashboard.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated {new Date(dashboard.updated_at).toLocaleDateString()}</span>
                    <span className="badge badge-neutral">Active</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Dashboard Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Give your dashboard a name and optional description
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="input-group">
              <label className="input-label">Dashboard Name *</label>
              <Input
                placeholder="e.g., Sales Analytics Dashboard"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                disabled={creating}
                className="input"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <Input
                placeholder="e.g., Monthly sales performance and KPI metrics"
                value={newDashboardDesc}
                onChange={(e) => setNewDashboardDesc(e.target.value)}
                disabled={creating}
                className="input"
              />
              <p className="input-hint">Help your team understand the purpose of this dashboard</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={creating || !newDashboardName.trim()}
              className="gap-2"
            >
              {creating ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Dashboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
