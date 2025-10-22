import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Get all agents for the current user
 * GET /api/agents
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get agents (RLS will filter by client automatically)
    const { data: agents, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Agents GET] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents: agents || [] })
  } catch (error: any) {
    console.error("[Agents GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch agents" },
      { status: 500 }
    )
  }
}

/**
 * Delete an agent
 * DELETE /api/agents?id=<agent_id>
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("id")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete agent (RLS will ensure user has permission)
    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", agentId)

    if (error) {
      console.error("[Agents DELETE] Error:", error)
      return NextResponse.json(
        { error: "Failed to delete agent" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Agents DELETE] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete agent" },
      { status: 500 }
    )
  }
}

/**
 * Create a new agent
 * POST /api/agents
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      description,
      system_prompt,
      model = "claude-3-5-sonnet-20240620",
      temperature = 0.7,
      max_tokens = 4000,
      available_tools = [],
      max_iterations = 10,
      status = "draft",
    } = body

    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: "name and system_prompt are required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's client_id
    const { data: clientUser } = await supabase
      .from("client_users")
      .select("client_id")
      .eq("user_id", user.id)
      .single()

    if (!clientUser) {
      return NextResponse.json(
        { error: "User not associated with a client" },
        { status: 400 }
      )
    }

    // Create agent
    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        client_id: clientUser.client_id,
        name,
        description,
        system_prompt,
        model,
        temperature,
        max_tokens,
        available_tools,
        max_iterations,
        status,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[Agents POST] Error:", error)
      return NextResponse.json(
        { error: "Failed to create agent" },
        { status: 500 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error("[Agents POST] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create agent" },
      { status: 500 }
    )
  }
}
