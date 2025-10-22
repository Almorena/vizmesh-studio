"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function AuthTestPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const handleGoogleLogin = async () => {
    const cacheBuster = Date.now()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?t=${cacheBuster}`,
      },
    })
    if (error) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This page tests OAuth with cache buster timestamp
        </p>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90"
        >
          Test Google Login (with cache buster)
        </button>
        <p className="text-xs text-muted-foreground mt-4">
          Check Network tab - callback URL should have ?t= parameter
        </p>
      </div>
    </div>
  )
}
