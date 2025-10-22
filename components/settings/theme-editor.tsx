"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, RotateCcw, Save, Eye, CheckCircle2 } from "lucide-react"
import { WIDGET_THEMES, type WidgetTheme } from "@/lib/widget-themes"
import {
  saveCustomThemes,
  loadCustomThemes,
  type ThemeColors,
  type WidgetBackgrounds
} from "@/lib/theme-storage"

export function ThemeEditor() {
  // State for each theme
  const [modernColors, setModernColors] = useState<ThemeColors>({
    background: WIDGET_THEMES.modern.preview.background,
    text: WIDGET_THEMES.modern.preview.text,
    accent: WIDGET_THEMES.modern.preview.accent,
    border: WIDGET_THEMES.modern.preview.border,
    dashboardBackground: "#f9fafb",
  })

  const [neutralColors, setNeutralColors] = useState<ThemeColors>({
    background: WIDGET_THEMES.neutral.preview.background,
    text: WIDGET_THEMES.neutral.preview.text,
    accent: WIDGET_THEMES.neutral.preview.accent,
    border: WIDGET_THEMES.neutral.preview.border,
    dashboardBackground: "#ffffff",
  })

  const [darkColors, setDarkColors] = useState<ThemeColors>({
    background: "#2d3748",
    text: WIDGET_THEMES.dark.preview.text,
    accent: WIDGET_THEMES.dark.preview.accent,
    border: WIDGET_THEMES.dark.preview.border,
    dashboardBackground: "#1a202c",
  })

  // State for widget backgrounds (3 colors for each theme)
  const [modernBackgrounds, setModernBackgrounds] = useState<WidgetBackgrounds>({
    color1: "#fef4f4", // Pastel Pink
    color2: "#f0f9ff", // Pastel Blue
    color3: "#f0fdf4", // Pastel Mint
  })

  const [neutralBackgrounds, setNeutralBackgrounds] = useState<WidgetBackgrounds>({
    color1: "#ffffff", // White
    color2: "#fafafa", // Light Gray
    color3: "#f5f5f5", // Lighter Gray
  })

  const [darkBackgrounds, setDarkBackgrounds] = useState<WidgetBackgrounds>({
    color1: "#2d3748", // Dark Blue Gray
    color2: "#1a202c", // Darker Blue Gray
    color3: "#2c3e50", // Dark Slate
  })

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load custom themes on mount
  useEffect(() => {
    const customThemes = loadCustomThemes()
    if (customThemes) {
      setModernColors(customThemes.modern)
      setNeutralColors(customThemes.neutral)
      setDarkColors(customThemes.dark)
      setModernBackgrounds(customThemes.modernBackgrounds)
      setNeutralBackgrounds(customThemes.neutralBackgrounds)
      setDarkBackgrounds(customThemes.darkBackgrounds)
    }
  }, [])

  const handleReset = (theme: WidgetTheme) => {
    switch (theme) {
      case "modern":
        setModernColors({
          background: WIDGET_THEMES.modern.preview.background,
          text: WIDGET_THEMES.modern.preview.text,
          accent: WIDGET_THEMES.modern.preview.accent,
          border: WIDGET_THEMES.modern.preview.border,
          dashboardBackground: "#f9fafb",
        })
        setModernBackgrounds({
          color1: "#fef4f4",
          color2: "#f0f9ff",
          color3: "#f0fdf4",
        })
        break
      case "neutral":
        setNeutralColors({
          background: WIDGET_THEMES.neutral.preview.background,
          text: WIDGET_THEMES.neutral.preview.text,
          accent: WIDGET_THEMES.neutral.preview.accent,
          border: WIDGET_THEMES.neutral.preview.border,
          dashboardBackground: "#ffffff",
        })
        setNeutralBackgrounds({
          color1: "#ffffff",
          color2: "#fafafa",
          color3: "#f5f5f5",
        })
        break
      case "dark":
        setDarkColors({
          background: "#2d3748",
          text: WIDGET_THEMES.dark.preview.text,
          accent: WIDGET_THEMES.dark.preview.accent,
          border: WIDGET_THEMES.dark.preview.border,
          dashboardBackground: "#1a202c",
        })
        setDarkBackgrounds({
          color1: "#2d3748",
          color2: "#1a202c",
          color3: "#2c3e50",
        })
        break
    }
  }

  const handleSave = () => {
    try {
      setSaving(true)
      setSaveSuccess(false)

      saveCustomThemes({
        modern: modernColors,
        neutral: neutralColors,
        dark: darkColors,
        modernBackgrounds,
        neutralBackgrounds,
        darkBackgrounds,
      })

      setSaveSuccess(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Failed to save theme customizations:", error)
      alert("Failed to save theme customizations. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Theme Customization
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize colors for each theme to match your brand
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            variant={saveSuccess ? "default" : "default"}
          >
            {saving ? (
              <>
                <div className="spinner w-4 h-4" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved Successfully
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="modern" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="modern">Modern & Colorful</TabsTrigger>
            <TabsTrigger value="neutral">Neutral & Clean</TabsTrigger>
            <TabsTrigger value="dark">Dark & Professional</TabsTrigger>
          </TabsList>

          {/* Modern Theme Editor */}
          <TabsContent value="modern" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Modern Theme Colors</h3>
              <Button variant="outline" size="sm" onClick={() => handleReset("modern")} className="gap-2">
                <RotateCcw className="h-3 w-3" />
                Reset to Default
              </Button>
            </div>

            {/* Widget Backgrounds Section */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Widget Background Colors (rotate per widget)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Widget Color 1</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={modernBackgrounds.color1}
                      onChange={(e) => setModernBackgrounds({ ...modernBackgrounds, color1: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={modernBackgrounds.color1}
                      onChange={(e) => setModernBackgrounds({ ...modernBackgrounds, color1: e.target.value })}
                      className="flex-1"
                      placeholder="#fef4f4"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Widget Color 2</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={modernBackgrounds.color2}
                      onChange={(e) => setModernBackgrounds({ ...modernBackgrounds, color2: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={modernBackgrounds.color2}
                      onChange={(e) => setModernBackgrounds({ ...modernBackgrounds, color2: e.target.value })}
                      className="flex-1"
                      placeholder="#f0f9ff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Widget Color 3</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={modernBackgrounds.color3}
                      onChange={(e) => setModernBackgrounds({ ...modernBackgrounds, color3: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={modernBackgrounds.color3}
                      onChange={(e) => setModernBackgrounds({ ...modernBackgrounds, color3: e.target.value })}
                      className="flex-1"
                      placeholder="#f0fdf4"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Colors Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Theme Colors</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={modernColors.background}
                        onChange={(e) => setModernColors({ ...modernColors, background: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={modernColors.background}
                        onChange={(e) => setModernColors({ ...modernColors, background: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={modernColors.text}
                        onChange={(e) => setModernColors({ ...modernColors, text: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={modernColors.text}
                        onChange={(e) => setModernColors({ ...modernColors, text: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={modernColors.accent}
                        onChange={(e) => setModernColors({ ...modernColors, accent: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={modernColors.accent}
                        onChange={(e) => setModernColors({ ...modernColors, accent: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Border Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={modernColors.border}
                        onChange={(e) => setModernColors({ ...modernColors, border: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={modernColors.border}
                        onChange={(e) => setModernColors({ ...modernColors, border: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dashboard Background</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={modernColors.dashboardBackground || "#f9fafb"}
                        onChange={(e) => setModernColors({ ...modernColors, dashboardBackground: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={modernColors.dashboardBackground || "#f9fafb"}
                        onChange={(e) => setModernColors({ ...modernColors, dashboardBackground: e.target.value })}
                        className="flex-1"
                        placeholder="#f9fafb"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </h4>
                <div
                  className="p-6 rounded-lg border-2 transition-all"
                  style={{
                    background: modernColors.background,
                    borderColor: modernColors.border,
                    color: modernColors.text
                  }}
                >
                  <h3 className="text-2xl font-bold mb-2" style={{ color: modernColors.text }}>
                    Sample Heading
                  </h3>
                  <p className="mb-4">This is how your theme will look.</p>
                  <button
                    className="px-4 py-2 rounded"
                    style={{
                      backgroundColor: modernColors.accent,
                      color: '#ffffff'
                    }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Neutral Theme Editor */}
          <TabsContent value="neutral" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Neutral Theme Colors</h3>
              <Button variant="outline" size="sm" onClick={() => handleReset("neutral")} className="gap-2">
                <RotateCcw className="h-3 w-3" />
                Reset to Default
              </Button>
            </div>

            {/* Widget Backgrounds Section */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Widget Background Colors (rotate per widget)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Widget Color 1</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={neutralBackgrounds.color1}
                      onChange={(e) => setNeutralBackgrounds({ ...neutralBackgrounds, color1: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={neutralBackgrounds.color1}
                      onChange={(e) => setNeutralBackgrounds({ ...neutralBackgrounds, color1: e.target.value })}
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Widget Color 2</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={neutralBackgrounds.color2}
                      onChange={(e) => setNeutralBackgrounds({ ...neutralBackgrounds, color2: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={neutralBackgrounds.color2}
                      onChange={(e) => setNeutralBackgrounds({ ...neutralBackgrounds, color2: e.target.value })}
                      className="flex-1"
                      placeholder="#fafafa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Widget Color 3</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={neutralBackgrounds.color3}
                      onChange={(e) => setNeutralBackgrounds({ ...neutralBackgrounds, color3: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={neutralBackgrounds.color3}
                      onChange={(e) => setNeutralBackgrounds({ ...neutralBackgrounds, color3: e.target.value })}
                      className="flex-1"
                      placeholder="#f5f5f5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Colors Section - same structure as Modern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Theme Colors</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={neutralColors.background}
                        onChange={(e) => setNeutralColors({ ...neutralColors, background: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={neutralColors.background}
                        onChange={(e) => setNeutralColors({ ...neutralColors, background: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={neutralColors.text}
                        onChange={(e) => setNeutralColors({ ...neutralColors, text: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={neutralColors.text}
                        onChange={(e) => setNeutralColors({ ...neutralColors, text: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={neutralColors.accent}
                        onChange={(e) => setNeutralColors({ ...neutralColors, accent: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={neutralColors.accent}
                        onChange={(e) => setNeutralColors({ ...neutralColors, accent: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Border Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={neutralColors.border}
                        onChange={(e) => setNeutralColors({ ...neutralColors, border: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={neutralColors.border}
                        onChange={(e) => setNeutralColors({ ...neutralColors, border: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dashboard Background</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={neutralColors.dashboardBackground || "#ffffff"}
                        onChange={(e) => setNeutralColors({ ...neutralColors, dashboardBackground: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={neutralColors.dashboardBackground || "#ffffff"}
                        onChange={(e) => setNeutralColors({ ...neutralColors, dashboardBackground: e.target.value })}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </h4>
                <div
                  className="p-6 rounded-lg border-2 transition-all"
                  style={{
                    background: neutralColors.background,
                    borderColor: neutralColors.border,
                    color: neutralColors.text
                  }}
                >
                  <h3 className="text-2xl font-bold mb-2" style={{ color: neutralColors.text }}>
                    Sample Heading
                  </h3>
                  <p className="mb-4">This is how your theme will look.</p>
                  <button
                    className="px-4 py-2 rounded"
                    style={{
                      backgroundColor: neutralColors.accent,
                      color: '#ffffff'
                    }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Dark Theme Editor */}
          <TabsContent value="dark" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Dark Theme Colors</h3>
              <Button variant="outline" size="sm" onClick={() => handleReset("dark")} className="gap-2">
                <RotateCcw className="h-3 w-3" />
                Reset to Default
              </Button>
            </div>

            {/* Widget Backgrounds Section */}
            <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Widget Background Colors (rotate per widget)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Widget Color 1</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={darkBackgrounds.color1}
                      onChange={(e) => setDarkBackgrounds({ ...darkBackgrounds, color1: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={darkBackgrounds.color1}
                      onChange={(e) => setDarkBackgrounds({ ...darkBackgrounds, color1: e.target.value })}
                      className="flex-1"
                      placeholder="#2d3748"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Widget Color 2</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={darkBackgrounds.color2}
                      onChange={(e) => setDarkBackgrounds({ ...darkBackgrounds, color2: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={darkBackgrounds.color2}
                      onChange={(e) => setDarkBackgrounds({ ...darkBackgrounds, color2: e.target.value })}
                      className="flex-1"
                      placeholder="#1a202c"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Widget Color 3</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      value={darkBackgrounds.color3}
                      onChange={(e) => setDarkBackgrounds({ ...darkBackgrounds, color3: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={darkBackgrounds.color3}
                      onChange={(e) => setDarkBackgrounds({ ...darkBackgrounds, color3: e.target.value })}
                      className="flex-1"
                      placeholder="#2c3e50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Colors Section - same structure as Modern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Theme Colors</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={darkColors.background}
                        onChange={(e) => setDarkColors({ ...darkColors, background: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={darkColors.background}
                        onChange={(e) => setDarkColors({ ...darkColors, background: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={darkColors.text}
                        onChange={(e) => setDarkColors({ ...darkColors, text: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={darkColors.text}
                        onChange={(e) => setDarkColors({ ...darkColors, text: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={darkColors.accent}
                        onChange={(e) => setDarkColors({ ...darkColors, accent: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={darkColors.accent}
                        onChange={(e) => setDarkColors({ ...darkColors, accent: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Border Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={darkColors.border}
                        onChange={(e) => setDarkColors({ ...darkColors, border: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={darkColors.border}
                        onChange={(e) => setDarkColors({ ...darkColors, border: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dashboard Background</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={darkColors.dashboardBackground || "#1a202c"}
                        onChange={(e) => setDarkColors({ ...darkColors, dashboardBackground: e.target.value })}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={darkColors.dashboardBackground || "#1a202c"}
                        onChange={(e) => setDarkColors({ ...darkColors, dashboardBackground: e.target.value })}
                        className="flex-1"
                        placeholder="#1a202c"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </h4>
                <div
                  className="p-6 rounded-lg border-2 transition-all"
                  style={{
                    background: darkColors.background,
                    borderColor: darkColors.border,
                    color: darkColors.text
                  }}
                >
                  <h3 className="text-2xl font-bold mb-2" style={{ color: darkColors.text }}>
                    Sample Heading
                  </h3>
                  <p className="mb-4">This is how your theme will look.</p>
                  <button
                    className="px-4 py-2 rounded"
                    style={{
                      backgroundColor: darkColors.accent,
                      color: '#ffffff'
                    }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
