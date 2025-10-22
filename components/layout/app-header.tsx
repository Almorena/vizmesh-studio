"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { ClientSelector } from "@/components/client/client-selector"
import { LogOut, Settings, Plug, LayoutDashboard, Brain } from "lucide-react"
import Link from "next/link"

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="nav-header">
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-semibold">VizMesh Studio</h2>
            <ClientSelector />
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/">
                <button className={`nav-link ${isActive("/") ? "nav-link-active" : ""}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboards
                </button>
              </Link>
              <Link href="/integrations">
                <button className={`nav-link ${isActive("/integrations") ? "nav-link-active" : ""}`}>
                  <Plug className="h-4 w-4" />
                  Integrations
                </button>
              </Link>
              <Link href="/agents">
                <button className={`nav-link ${isActive("/agents") ? "nav-link-active" : ""}`}>
                  <Brain className="h-4 w-4" />
                  Agents
                </button>
              </Link>
              <Link href="/settings">
                <button className={`nav-link ${isActive("/settings") ? "nav-link-active" : ""}`}>
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </Link>
            </nav>
          </div>
          <Button variant="ghost" onClick={handleSignOut} size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
