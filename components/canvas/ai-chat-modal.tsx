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
}

export function AIChatModal({ open, onOpenChange, onWidgetGenerated }: AIChatModalProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe what you want to visualize")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-widget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          availableDataSources: [], // TODO: Pass actual data sources
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate widget")
      }

      const data: GenerateWidgetResponse = await response.json()

      onWidgetGenerated(data)
      setPrompt("")
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error generating widget:", err)
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
            Create Widget with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you want to visualize, and AI will create it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Example: Show me a line chart of monthly revenue trends for the last 6 months"
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

          <div className="rounded-lg bg-blue-50 p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">Tips:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Be specific about the type of chart (line, bar, pie, etc.)</li>
              <li>Mention the data you want to visualize</li>
              <li>Include time ranges or filters if needed</li>
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Widget
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
