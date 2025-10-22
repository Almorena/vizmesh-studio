import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { SPOTIFY_SCOPES } from "@/lib/integrations/spotify"

/**
 * OAuth Connect - Initiate OAuth flow for pre-built integrations
 * GET /api/oauth/connect?provider=spotify
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/auth", req.url))
    }

    const { searchParams } = new URL(req.url)
    const provider = searchParams.get("provider")

    if (!provider) {
      return NextResponse.json({ error: "Provider parameter required" }, { status: 400 })
    }

    // Build OAuth URL based on provider
    let authUrl: string

    if (provider === "spotify") {
      authUrl = buildSpotifyAuthUrl(user.id)
    } else if (provider === "github") {
      authUrl = buildGitHubAuthUrl(user.id)
    } else {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
    }

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("[OAuth Connect] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * Build Spotify OAuth authorization URL
 */
function buildSpotifyAuthUrl(userId: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/api/oauth/callback/spotify`

  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID not configured in environment variables")
  }

  // Create state with user ID
  const state = Buffer.from(
    JSON.stringify({
      provider: "spotify",
      userId,
      timestamp: Date.now(),
    })
  ).toString("base64")

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: SPOTIFY_SCOPES.join(" "),
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

/**
 * Build GitHub OAuth authorization URL
 */
function buildGitHubAuthUrl(userId: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/api/oauth/callback/github`

  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID not configured in environment variables")
  }

  // Create state with user ID
  const state = Buffer.from(
    JSON.stringify({
      provider: "github",
      userId,
      timestamp: Date.now(),
    })
  ).toString("base64")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "user repo",
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}
