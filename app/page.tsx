"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { ArrowRight, Sparkles, Zap, Shield, Plus, Loader2, Grid3x3 } from "lucide-react"

interface Dashboard {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState("")
  const [newDashboardDesc, setNewDashboardDesc] = useState("")

  useEffect(() => {
    loadDashboards()
  }, [])

  const loadDashboards = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboards")

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
    if (!newDashboardName.trim()) return

    try {
      setCreating(true)
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDashboardName,
          description: newDashboardDesc || null
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create dashboard")
      }

      const { dashboard } = await response.json()

      // Navigate to new dashboard
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            VizMesh Studio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI-Powered Data Visualization Platform
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <Sparkles className="h-10 w-10 text-blue-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">AI-First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe your visualization in natural language, let AI build it
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <Zap className="h-10 w-10 text-indigo-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create complex dashboards in seconds, not hours
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <Shield className="h-10 w-10 text-purple-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Secure Sandbox</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-generated code runs in isolated sandbox environment
              </p>
            </div>
          </div>
        </div>

        {/* Dashboards Section */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Dashboards
            </h2>
            <Button onClick={() => setModalOpen(true)} size="lg">
              <Plus className="h-5 w-5" />
              New Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : dashboards.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <Grid3x3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No dashboards yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first dashboard to start building visualizations
              </p>
              <Button onClick={() => setModalOpen(true)} size="lg">
                <Plus className="h-5 w-5" />
                Create Your First Dashboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Grid3x3 className="h-10 w-10 text-blue-600" />
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{dashboard.name}</h3>
                  {dashboard.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {dashboard.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Dashboard Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Give your dashboard a name and description
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Dashboard Name
              </label>
              <Input
                placeholder="e.g., Sales Analytics"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (optional)
              </label>
              <Input
                placeholder="e.g., Monthly sales performance metrics"
                value={newDashboardDesc}
                onChange={(e) => setNewDashboardDesc(e.target.value)}
                disabled={creating}
              />
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
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
