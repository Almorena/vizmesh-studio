"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles } from "lucide-react"
import type { GenerateWidgetResponse } from "@/lib/types/widget"

interface AIChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWidgetGenerated: (response: GenerateWidgetResponse) => void
  editMode?: boolean
  existingWidget?: {
    id: string
    title: string
    prompt: string
    visualization: any
    data_source: any
  }
}

export function AIChatModal({
  open,
  onOpenChange,
  onWidgetGenerated,
  editMode = false,
  existingWidget
}: AIChatModalProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(editMode ? "Please describe what changes you want to make" : "Please describe what you want to visualize")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`[AIChatModal] ${editMode ? 'Editing' : 'Generating'} widget with prompt:`, prompt)

      const response = await fetch("/api/ai/generate-widget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          availableDataSources: [], // TODO: Pass actual data sources
          editMode,
          existingWidget: editMode ? {
            title: existingWidget?.title,
            currentCode: existingWidget?.visualization?.componentCode,
            dataSource: existingWidget?.data_source
          } : undefined
        }),
      })

      console.log("[AIChatModal] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[AIChatModal] API error:", errorData)
        throw new Error(errorData.error || `Failed to ${editMode ? 'edit' : 'generate'} widget`)
      }

      const data: GenerateWidgetResponse = await response.json()
      console.log(`[AIChatModal] Widget ${editMode ? 'edited' : 'generated'} successfully:`, data)

      // If in edit mode, include the widget ID in the response
      if (editMode && existingWidget) {
        data.widgetId = existingWidget.id
      }

      onWidgetGenerated(data)
      setPrompt("")
      onOpenChange(false)
    } catch (err: any) {
      console.error(`[AIChatModal] Error ${editMode ? 'editing' : 'generating'} widget:`, err)
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {editMode ? `Edit Widget: ${existingWidget?.title}` : 'Create Widget with AI'}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Describe the changes you want to make to this widget.'
              : 'Describe what you want to visualize, and AI will create it for you.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder={
              editMode
                ? "Example: Make the news titles clickable links that open in a new tab, and add the source name in small text below each item"
                : "Example: Show me a line chart of monthly revenue trends for the last 6 months"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
            disabled={loading}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {editMode ? (
                <>
                  <li>Describe specific UI changes you want</li>
                  <li>Mention styling, interactivity, or layout modifications</li>
                  <li>Ask to add or remove specific features</li>
                </>
              ) : (
                <>
                  <li>Be specific about the type of chart (line, bar, pie, etc.)</li>
                  <li>Mention the data you want to visualize</li>
                  <li>Include time ranges or filters if needed</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {editMode ? 'Updating...' : 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {editMode ? 'Update Widget' : 'Generate Widget'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
