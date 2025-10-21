"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AIChatModal } from "@/components/canvas/ai-chat-modal"
import { WidgetRenderer } from "@/components/canvas/widget-renderer"
import { Plus, Home, Trash2 } from "lucide-react"
import Link from "next/link"
import type { GenerateWidgetResponse } from "@/lib/types/widget"

export default function CanvasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [widgets, setWidgets] = useState<GenerateWidgetResponse[]>([])

  const handleWidgetGenerated = (response: GenerateWidgetResponse) => {
    console.log("Widget generated:", response)
    setWidgets((prev) => [...prev, response])
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
              <h1 className="text-xl font-bold text-gray-900">VizMesh Studio</h1>
              <p className="text-sm text-gray-500">AI-Powered Canvas</p>
            </div>
          </div>

          <Button onClick={() => setModalOpen(true)} size="lg">
            <Plus className="h-5 w-5" />
            Add Widget
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
                Your canvas is empty
              </h2>
              <p className="text-gray-600 max-w-md">
                Click the "Add Widget" button to create your first AI-powered visualization
              </p>
              <Button onClick={() => setModalOpen(true)} size="lg">
                <Plus className="h-5 w-5" />
                Add Your First Widget
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 border-b flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{widget.widget.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{widget.explanation}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWidgets((prev) => prev.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-80 bg-gray-50">
                  <WidgetRenderer
                    componentCode={widget.widget.visualization.componentCode}
                    data={widget.widget.dataSource.config.data || widget.widget.dataSource.config}
                    className="h-full"
                  />
                </div>

                {widget.suggestions && widget.suggestions.length > 0 && (
                  <div className="p-4 border-t bg-blue-50">
                    <p className="text-xs font-medium text-blue-900 mb-2">AI Suggestions:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {widget.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
