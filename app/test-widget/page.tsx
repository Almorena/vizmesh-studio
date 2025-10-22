"use client"

import { useState } from "react"
import { WidgetRenderer } from "@/components/canvas/widget-renderer"
import { WIDGET_TEMPLATES } from "@/lib/widget-templates"
import { Button } from "@/components/ui/button"
import type { WidgetTheme } from "@/lib/widget-themes"

export default function TestWidgetPage() {
  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>("modern")

  const template = WIDGET_TEMPLATES[selectedTheme]

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-light mb-2">Widget Theme Test</h1>
          <p className="text-muted-foreground">Test dei tre temi disponibili</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant={selectedTheme === "modern" ? "default" : "outline"}
            onClick={() => setSelectedTheme("modern")}
          >
            Modern
          </Button>
          <Button
            variant={selectedTheme === "neutral" ? "default" : "outline"}
            onClick={() => setSelectedTheme("neutral")}
          >
            Neutral
          </Button>
          <Button
            variant={selectedTheme === "dark" ? "default" : "outline"}
            onClick={() => setSelectedTheme("dark")}
          >
            Dark
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden" style={{ height: "600px" }}>
          <WidgetRenderer
            componentCode={template.code}
            data={{}}
            theme={selectedTheme}
            className="h-full w-full"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>{template.name}</strong></p>
          <p>{template.description}</p>
        </div>
      </div>
    </div>
  )
}
