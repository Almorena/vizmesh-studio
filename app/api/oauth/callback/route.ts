import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * OAuth Callback Handler
 * Handles OAuth callback from providers (Spotify, Google, GitHub, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      console.error("[OAuth] Error from provider:", error)
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(error)}`, req.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_code_or_state", req.url)
      )
    }

    // Parse state to get provider and source ID
    const stateData = JSON.parse(Buffer.from(state, "base64").toString())
    const { provider, sourceId } = stateData

    console.log("[OAuth] Callback received:", { provider, sourceId })

    // Get source from database
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/auth", req.url))
    }

    const { data: source, error: sourceError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("id", sourceId)
      .eq("user_id", user.id)
      .single()

    if (sourceError || !source) {
      console.error("[OAuth] Source not found:", sourceError)
      return NextResponse.redirect(
        new URL("/integrations?error=source_not_found", req.url)
      )
    }

    // Exchange code for token based on provider
    let tokens
    if (provider === "spotify") {
      tokens = await exchangeSpotifyCode(code, source.config)
    } else if (provider === "github") {
      tokens = await exchangeGitHubCode(code, source.config)
    } else {
      throw new Error(`Unsupported OAuth provider: ${provider}`)
    }

    // Update source with tokens
    const updatedConfig = {
      ...source.config,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    }

    const { error: updateError } = await supabase
      .from("data_sources")
      .update({ config: updatedConfig })
      .eq("id", sourceId)

    if (updateError) {
      console.error("[OAuth] Failed to update source:", updateError)
      return NextResponse.redirect(
        new URL("/integrations?error=failed_to_save_token", req.url)
      )
    }

    console.log("[OAuth] Successfully authenticated:", provider)

    return NextResponse.redirect(
      new URL("/integrations?success=true", req.url)
    )
  } catch (error: any) {
    console.error("[OAuth] Error:", error)
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }
}

/**
 * Exchange Spotify authorization code for access token
 */
async function exchangeSpotifyCode(
  code: string,
  config: any
): Promise<any> {
  const { clientId, clientSecret } = config

  if (!clientId || !clientSecret) {
    throw new Error("Spotify clientId and clientSecret are required")
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/api/oauth/callback`

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
    throw new Error(`Spotify token exchange failed: ${errorText}`)
  }

  return await response.json()
}

/**
 * Exchange GitHub authorization code for access token
 */
async function exchangeGitHubCode(
  code: string,
  config: any
): Promise<any> {
  const { clientId, clientSecret } = config

  if (!clientId || !clientSecret) {
    throw new Error("GitHub clientId and clientSecret are required")
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub token exchange failed: ${errorText}`)
  }

  const data = await response.json()

  // GitHub returns { access_token, token_type, scope }
  // Convert to standard format
  return {
    access_token: data.access_token,
    token_type: data.token_type,
    scope: data.scope,
    // GitHub tokens don't expire by default
    expires_in: 999999999,
  }
}
