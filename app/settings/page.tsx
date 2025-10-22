"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Palette } from "lucide-react"
import { UsageHistory } from "@/components/usage/usage-history"
import { ThemeEditor } from "@/components/settings/theme-editor"
import { AppHeader } from "@/components/layout/app-header"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10" />
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
              Settings
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              Manage your account preferences and customize your experience
            </p>
          </div>
        </div>
      </section>

      {/* Main Settings Section */}
      <main className="container-app py-12">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Usage & Billing
              </TabsTrigger>
              <TabsTrigger value="themes" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme Editor
              </TabsTrigger>
            </TabsList>

            {/* Usage Tab */}
            <TabsContent value="usage">
              <UsageHistory />
            </TabsContent>

            {/* Theme Editor Tab */}
            <TabsContent value="themes">
              <ThemeEditor />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
