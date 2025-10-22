"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export default function AuthPage() {
  const router = useRouter()
  const { user, signIn, signUp, signInWithGoogle } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        alert("Check your email to confirm your account!")
      } else {
        await signIn(email, password)
        router.push("/")
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setGoogleLoading(true)

    try {
      await signInWithGoogle()
      // Redirect will be handled automatically by Supabase
    } catch (err: any) {
      setError(err.message || "Google sign-in failed")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="nav-header">
        <div className="container-app">
          <div className="flex h-16 items-center">
            <h2 className="text-xl font-semibold">VizMesh Studio</h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-narrow py-16">
        <div className="max-w-md mx-auto animate-fade-in">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light tracking-tight mb-3">
              {isSignUp ? "Create Account" : "Sign In"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Get started with VizMesh Studio"
                : "Welcome back to VizMesh Studio"}
            </p>
          </div>

          {/* Auth Card */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="input-group">
                <label className="input-label">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                  required
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  required
                  minLength={6}
                  className="input"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading || googleLoading}>
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>{isSignUp ? "Create Account" : "Sign In"}</>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full divider"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-card text-muted-foreground">
                  OR
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                }}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                disabled={loading || googleLoading}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            AI-Powered Data Visualization Platform
          </p>
        </div>
      </main>
    </div>
  )
}
