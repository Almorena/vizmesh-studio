import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getClientIdFromRequest, verifyClientAccess } from "@/lib/client/verify-client-access"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(req)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    const { data: sources, error } = await supabase
      .from("data_sources")
      .select("*")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[DataSources] Error fetching:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sources })
  } catch (error: any) {
    console.error("[DataSources] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(req)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    const body = await req.json()
    const { name, type, config } = body

    if (!name || !type || !config) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: source, error } = await supabase
      .from("data_sources")
      .insert({ user_id: user.id, client_id: clientId, name, type, config })
      .select()
      .single()

    if (error) {
      console.error("[DataSources] Error creating:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ source })
  } catch (error: any) {
    console.error("[DataSources] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(req)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const body = await req.json()
    const { name, type, config } = body

    if (!name || !type || !config) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: source, error } = await supabase
      .from("data_sources")
      .update({ name, type, config })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .select()
      .single()

    if (error) {
      console.error("[DataSources] Error updating:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ source })
  } catch (error: any) {
    console.error("[DataSources] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client_id from request
    const clientId = getClientIdFromRequest(req)
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Verify user has access to this client
    const hasAccess = await verifyClientAccess(supabase, user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this client" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("data_sources")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("client_id", clientId)

    if (error) {
      console.error("[DataSources] Error deleting:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[DataSources] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
