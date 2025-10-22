import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Spotify OAuth Callback
 * Handles callback from Spotify OAuth and stores tokens
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      console.error("[Spotify OAuth] Error from Spotify:", error)
      return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, req.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/integrations?error=missing_code_or_state", req.url))
    }

    // Parse state to get user ID
    const stateData = JSON.parse(Buffer.from(state, "base64").toString())
    const { userId, provider } = stateData

    if (provider !== "spotify") {
      return NextResponse.redirect(new URL("/integrations?error=invalid_provider", req.url))
    }

    console.log("[Spotify OAuth] Callback received for user:", userId)

    // Exchange code for tokens
    const tokens = await exchangeSpotifyCode(code)

    // Store tokens in oauth_connections table
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.redirect(new URL("/auth", req.url))
    }

    // Calculate expires_at
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Upsert connection (update if exists, insert if not)
    const { error: upsertError } = await supabase.from("oauth_connections").upsert(
      {
        user_id: user.id,
        provider: "spotify",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || "Bearer",
        expires_at: expiresAt,
        scopes: tokens.scope ? tokens.scope.split(" ") : [],
        status: "active",
        metadata: {
          token_received_at: new Date().toISOString(),
        },
      },
      {
        onConflict: "user_id,provider",
      }
    )

    if (upsertError) {
      console.error("[Spotify OAuth] Failed to store tokens:", upsertError)
      return NextResponse.redirect(new URL("/integrations?error=failed_to_save_token", req.url))
    }

    console.log("[Spotify OAuth] Successfully authenticated")

    return NextResponse.redirect(new URL("/integrations?success=spotify_connected", req.url))
  } catch (error: any) {
    console.error("[Spotify OAuth] Error:", error)
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }
}

/**
 * Exchange Spotify authorization code for access token
 */
async function exchangeSpotifyCode(code: string): Promise<any> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/api/oauth/callback/spotify`

  if (!clientId || !clientSecret) {
    throw new Error("Spotify CLIENT_ID and CLIENT_SECRET must be configured")
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Spotify OAuth] Token exchange failed:", errorText)
    throw new Error(`Spotify token exchange failed: ${errorText}`)
  }

  return await response.json()
}
