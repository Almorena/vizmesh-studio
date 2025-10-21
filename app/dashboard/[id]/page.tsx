"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AIChatModal } from "@/components/canvas/ai-chat-modal"
import { WidgetRenderer } from "@/components/canvas/widget-renderer"
import { Plus, Home, Trash2, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import type { GenerateWidgetResponse } from "@/lib/types/widget"

interface SavedWidget {
  id: string
  prompt: string
  title: string
  data_source: any
  visualization: any
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.id as string

  const [modalOpen, setModalOpen] = useState(false)
  const [widgets, setWidgets] = useState<SavedWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load widgets from database
  useEffect(() => {
    loadWidgets()
  }, [dashboardId])

  const loadWidgets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboards/${dashboardId}/widgets`)

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
      console.error("Error loading widgets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWidgetGenerated = async (response: GenerateWidgetResponse) => {
    try {
      setSaving(true)

      // Save widget to database
      const saveResponse = await fetch(`/api/dashboards/${dashboardId}/widgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: response.widget.prompt,
          title: response.widget.title,
          dataSource: response.widget.dataSource,
          visualization: response.widget.visualization,
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 }
        })
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save widget")
      }

      const { widget } = await saveResponse.json()

      setWidgets((prev) => [...prev, widget])
    } catch (error) {
      console.error("Error saving widget:", error)
      alert("Failed to save widget")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      const response = await fetch(
        `/api/dashboards/${dashboardId}/widgets?widgetId=${widgetId}`,
        { method: "DELETE" }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">
                {widgets.length} widget{widgets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <Button onClick={() => setModalOpen(true)} size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Widget
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Canvas Grid */}
      <main className="p-6">
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Your dashboard is empty
              </h2>
              <p className="text-gray-600 max-w-md">
                Click "Add Widget" to create your first AI-powered visualization
              </p>
              <Button onClick={() => setModalOpen(true)} size="lg">
                <Plus className="h-5 w-5" />
                Add Your First Widget
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 border-b flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{widget.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {widget.prompt}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-80 bg-gray-50">
                  <WidgetRenderer
                    componentCode={widget.visualization.componentCode}
                    data={widget.data_source.config.data || widget.data_source.config}
                    className="h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* AI Chat Modal */}
      <AIChatModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onWidgetGenerated={handleWidgetGenerated}
      />
    </div>
  )
}
