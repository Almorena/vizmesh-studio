"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useClient } from "@/lib/client/client-context"
import { getWithClient, postWithClient, patchWithClient, deleteWithClient } from "@/lib/client/api-client"
import { Button } from "@/components/ui/button"
import { AIChatModal } from "@/components/canvas/ai-chat-modal"
import { EditDashboardModal } from "@/components/dashboard/edit-dashboard-modal"
import { WidgetSizeSelector } from "@/components/dashboard/widget-size-selector"
import { WidgetWithData } from "@/components/canvas/widget-with-data"
import { ClientSelector } from "@/components/client/client-selector"
import { Plus, Home, Trash2, Settings, Maximize2, Pencil, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { GenerateWidgetResponse } from "@/lib/types/widget"
import type { WidgetTheme } from "@/lib/widget-themes"
import { getThemeBackground } from "@/lib/widget-themes"
import { logger } from "@/lib/utils/logger"

interface SavedWidget {
  id: string
  prompt: string
  title: string
  data_source: any
  visualization: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  column_span?: number
  created_at?: string
  updated_at?: string
  cached_data?: any
  cache_updated_at?: string
}

interface Dashboard {
  id: string
  name: string
  theme: WidgetTheme
  created_at: string
  updated_at: string
  last_refreshed_at?: string
}

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeClient, loading: clientLoading } = useClient()
  const dashboardId = params.id as string

  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [sizeModalOpen, setSizeModalOpen] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<SavedWidget | null>(null)
  const [editWidgetModalOpen, setEditWidgetModalOpen] = useState(false)
  const [widgetToEdit, setWidgetToEdit] = useState<SavedWidget | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [widgets, setWidgets] = useState<SavedWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<string>("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && activeClient) {
      loadDashboard()
      loadWidgets()
      // Don't auto-refresh on load - user can manually refresh
    }
  }, [dashboardId, user, activeClient])

  const loadDashboard = async () => {
    if (!activeClient) return

    try {
      const response = await getWithClient(`/api/dashboards/${dashboardId}`, activeClient.id)

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/")
          return
        }
        // For any error, use default values (API might not exist yet)
        logger.warn("Dashboard", "API not available, using defaults")
        setDashboard({
          id: dashboardId,
          name: "Dashboard",
          theme: "neutral",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        return
      }

      const data = await response.json()
      // Ensure theme exists, default to neutral if not
      setDashboard({
        ...data,
        theme: data.theme || "neutral"
      })
    } catch (error) {
      logger.warn("Dashboard", "Error loading dashboard, using defaults:", error)
      // Set default dashboard on any error
      setDashboard({
        id: dashboardId,
        name: "Dashboard",
        theme: "neutral",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  const loadWidgets = async () => {
    if (!activeClient) return

    try {
      setLoading(true)
      const response = await getWithClient(`/api/dashboards/${dashboardId}/widgets`, activeClient.id)

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/")
          return
        }
        throw new Error("Failed to load widgets")
      }

      const data = await response.json()
      setWidgets(data.widgets || [])
    } catch (error) {
      logger.error("Dashboard", "Error loading widgets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWidgetGenerated = async (response: GenerateWidgetResponse & { widgetId?: string }) => {
    if (!activeClient) {
      alert("No active client selected")
      return
    }

    try {
      const isUpdate = !!response.widgetId
      console.log(`[Dashboard] Widget ${isUpdate ? 'updated' : 'generated'}, saving to database...`, response)
      setSaving(true)

      if (isUpdate) {
        // Update existing widget
        const updateResponse = await patchWithClient(
          `/api/dashboards/${dashboardId}/widgets?widgetId=${response.widgetId}`,
          {
            title: response.widget.title,
            visualization: response.widget.visualization,
            data_source: response.widget.dataSource
          },
          activeClient.id
        )

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json()
          console.error("[Dashboard] Update failed:", errorData)
          throw new Error(errorData.error || "Failed to update widget")
        }

        const { widget } = await updateResponse.json()
        console.log("[Dashboard] Widget updated successfully:", widget)
        console.log("[Dashboard] Widget updated_at:", widget.updated_at)
        console.log("[Dashboard] Widget visualization code length:", widget.visualization?.componentCode?.length)

        setWidgets((prev) => {
          const updated = prev.map((w) => (w.id === widget.id ? widget : w))
          console.log("[Dashboard] Updated widgets state:", updated.map(w => ({ id: w.id, updated_at: w.updated_at })))
          return updated
        })
      } else {
        // Create new widget
        const payload = {
          prompt: response.widget.prompt,
          title: response.widget.title,
          dataSource: response.widget.dataSource,
          visualization: response.widget.visualization,
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 }
        }

        const saveResponse = await postWithClient(
          `/api/dashboards/${dashboardId}/widgets`,
          payload,
          activeClient.id
        )

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json()
          console.error("[Dashboard] Save failed:", errorData)
          throw new Error(errorData.error || "Failed to save widget")
        }

        const { widget } = await saveResponse.json()
        console.log("[Dashboard] Widget saved successfully:", widget)

        setWidgets((prev) => [...prev, widget])
      }
    } catch (error) {
      console.error(`[Dashboard] Error ${response.widgetId ? 'updating' : 'saving'} widget:`, error)
      alert(`Failed to ${response.widgetId ? 'update' : 'save'} widget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditWidget = (widget: SavedWidget) => {
    setWidgetToEdit(widget)
    setEditWidgetModalOpen(true)
  }

  const handleDeleteWidget = async (widgetId: string) => {
    if (!activeClient) {
      alert("No active client selected")
      return
    }

    try {
      const response = await deleteWithClient(
        `/api/dashboards/${dashboardId}/widgets?widgetId=${widgetId}`,
        activeClient.id
      )

      if (!response.ok) {
        throw new Error("Failed to delete widget")
      }

      setWidgets((prev) => prev.filter((w) => w.id !== widgetId))
    } catch (error) {
      console.error("Error deleting widget:", error)
      alert("Failed to delete widget")
    }
  }

  const refreshDashboardData = async () => {
    if (!activeClient) {
      alert("No active client selected")
      return
    }

    try {
      setRefreshing(true)
      setRefreshStatus("Fetching fresh data from sources...")
      console.log("[Dashboard] Refreshing data...")

      const response = await postWithClient(
        `/api/dashboards/${dashboardId}/refresh`,
        {},
        activeClient.id
      )

      if (response.ok) {
        const result = await response.json()
        console.log("[Dashboard] Data refreshed:", result)

        setRefreshStatus("Updating dashboard metadata...")
        // Reload dashboard to get updated last_refreshed_at
        await loadDashboard()

        setRefreshStatus("Loading refreshed widgets...")
        // Reload widgets to display refreshed data
        await loadWidgets()

        setRefreshStatus("Complete! Dashboard updated successfully.")
        setTimeout(() => setRefreshStatus(""), 2000)
      }
    } catch (error) {
      console.error("[Dashboard] Error refreshing data:", error)
      setRefreshStatus("Error refreshing data. Please try again.")
      setTimeout(() => setRefreshStatus(""), 3000)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDashboardSaved = (name: string, theme: WidgetTheme) => {
    setDashboard((prev) => prev ? { ...prev, name, theme } : null)
  }

  const handleEditSize = (widget: SavedWidget) => {
    setSelectedWidget(widget)
    setSizeModalOpen(true)
  }

  const handleSizeChange = async (newSize: number) => {
    if (!selectedWidget || !activeClient) return

    try {
      const response = await patchWithClient(
        `/api/dashboards/${dashboardId}/widgets?widgetId=${selectedWidget.id}`,
        { column_span: newSize },
        activeClient.id
      )

      if (!response.ok) {
        throw new Error("Failed to update widget size")
      }

      const { widget: updatedWidget } = await response.json()
      setWidgets((prev) =>
        prev.map((w) => (w.id === updatedWidget.id ? updatedWidget : w))
      )
    } catch (error) {
      console.error("Error updating widget size:", error)
      alert("Failed to update widget size")
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No client selected or no clients available</p>
          <p className="text-sm text-muted-foreground">Please contact your administrator to get access to a client</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </div>
    )
  }

  const themeBackground = dashboard?.theme ? getThemeBackground(dashboard.theme) : '#ffffff'

  return (
    <div
      className="min-h-screen"
      style={{ background: themeBackground }}
    >
      {/* Header */}
      <header className="nav-header" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="container-app">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              <ClientSelector />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-light">{dashboard?.name || "Dashboard"}</h1>
                  <span className="text-sm text-muted-foreground font-light">
                    ({widgets.length})
                  </span>
                </div>
                {dashboard?.last_refreshed_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last updated: {new Date(dashboard.last_refreshed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {refreshStatus && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  {refreshing && <div className="spinner w-3 h-3" />}
                  <span className="text-xs text-blue-700 font-medium">
                    {refreshStatus}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshDashboardData}
                  disabled={refreshing || saving}
                  className="gap-2"
                >
                  {refreshing ? (
                    <>
                      <div className="spinner w-4 h-4" />
                      Refreshing
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  disabled={saving || refreshing}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => setModalOpen(true)} disabled={saving || refreshing} className="gap-2">
                  {saving ? (
                    <>
                      <div className="spinner w-4 h-4" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Widget
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-app py-8">
        {widgets.length === 0 ? (
          <div className="empty-state min-h-[calc(100vh-200px)] animate-scale-in">
            <div className="empty-state-icon">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="empty-state-title">Your dashboard is empty</h2>
              <p className="empty-state-description">
                Click "Add Widget" to create your first AI-powered visualization
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Widget
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up">
            {widgets.map((widget, index) => {
              const columnSpan = widget.column_span || 1
              const spanClass = columnSpan === 3 ? 'xl:col-span-3 lg:col-span-2' : columnSpan === 2 ? 'xl:col-span-2 lg:col-span-2' : ''

              return (
              <div key={widget.id} className={`relative group ${spanClass}`}>
                {/* Action Buttons - Floating */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditWidget(widget)}
                    className="bg-white/90 hover:bg-white shadow-lg"
                    title="Edit with AI"
                  >
                    <Pencil className="h-4 w-4 text-purple-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditSize(widget)}
                    className="bg-white/90 hover:bg-white shadow-lg"
                    title="Resize widget"
                  >
                    <Maximize2 className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="bg-white/90 hover:bg-white shadow-lg"
                    title="Delete widget"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                {/* Widget - Full card with rounded corners */}
                <div className="overflow-hidden rounded-2xl shadow-xl" style={{ height: "500px", display: "flex", flexDirection: "column" }}>
                  <WidgetWithData
                    key={widget.id}
                    componentCode={widget.visualization.componentCode}
                    dataSource={widget.data_source}
                    cachedData={widget.cached_data}
                    theme={dashboard?.theme || "neutral"}
                    title={widget.title}
                    className="flex-1 w-full overflow-auto"
                    widgetIndex={index}
                  />
                </div>
              </div>
            )})}
          </div>
        )}
      </main>

      {/* AI Chat Modal */}
      <AIChatModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onWidgetGenerated={handleWidgetGenerated}
      />

      {/* Edit Dashboard Modal */}
      {dashboard && (
        <EditDashboardModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          dashboardId={dashboardId}
          currentName={dashboard.name}
          currentTheme={dashboard.theme}
          onSaved={handleDashboardSaved}
        />
      )}

      {/* Widget Size Selector */}
      {selectedWidget && (
        <WidgetSizeSelector
          open={sizeModalOpen}
          onOpenChange={setSizeModalOpen}
          currentSize={selectedWidget.column_span || 1}
          onSizeChange={handleSizeChange}
        />
      )}

      {/* Edit Widget Modal */}
      {widgetToEdit && (
        <AIChatModal
          open={editWidgetModalOpen}
          onOpenChange={setEditWidgetModalOpen}
          onWidgetGenerated={handleWidgetGenerated}
          editMode={true}
          existingWidget={widgetToEdit}
        />
      )}
    </div>
  )
}
