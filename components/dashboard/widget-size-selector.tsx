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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Maximize2 } from "lucide-react"

interface WidgetSizeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSize: number
  onSizeChange: (size: number) => void
}

export function WidgetSizeSelector({
  open,
  onOpenChange,
  currentSize,
  onSizeChange,
}: WidgetSizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState(currentSize.toString())
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSizeChange(parseInt(selectedSize))
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving size:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Widget Size</DialogTitle>
          <DialogDescription>
            Choose how many columns this widget should span
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="1" id="size-1" />
              <div className="flex-1">
                <Label htmlFor="size-1" className="cursor-pointer font-medium">
                  Small (1 column)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Best for simple metrics and small charts
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="2" id="size-2" />
              <div className="flex-1">
                <Label htmlFor="size-2" className="cursor-pointer font-medium">
                  Medium (2 columns)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Good for medium-sized charts and data tables
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
              <RadioGroupItem value="3" id="size-3" />
              <div className="flex-1">
                <Label htmlFor="size-3" className="cursor-pointer font-medium">
                  Large (3 columns)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Perfect for detailed dashboards and complex visualizations
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="spinner w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
