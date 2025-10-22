import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { executeAgent, AgentConfig } from "@/lib/ai/agent-executor"
import { getToolsForIntegration } from "@/lib/ai/agent-tools"

/**
 * Execute an AI Agent
 * POST /api/agents/execute
 *
 * Body:
 * {
 *   agentId?: string,           // Use existing agent from DB
 *   agentConfig?: AgentConfig,  // Or provide ad-hoc config
 *   userPrompt: string,
 *   context?: any,
 *   widgetId?: string           // Link to widget
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { agentId, agentConfig, userPrompt, context, widgetId } = await req.json()

    if (!userPrompt) {
      return NextResponse.json(
        { error: "userPrompt is required" },
        { status: 400 }
      )
    }

    console.log("[Agent Execute] Starting execution:", { agentId, userPrompt })

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get agent config (from DB or provided)
    let config: AgentConfig

    if (agentId) {
      // Load agent from database
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single()

      if (agentError || !agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        )
      }

      // Convert DB agent to AgentConfig
      config = {
        id: agent.id,
        name: agent.name,
        system_prompt: agent.system_prompt,
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        available_tools: agent.available_tools,
        max_iterations: agent.max_iterations,
      }
    } else if (agentConfig) {
      // Use provided config
      config = agentConfig
    } else {
      return NextResponse.json(
        { error: "Either agentId or agentConfig must be provided" },
        { status: 400 }
      )
    }

    // Execute agent
    const execution = await executeAgent(config, userPrompt, context)

    console.log("[Agent Execute] Completed:", {
      status: execution.status,
      steps: execution.steps.length,
      tokens: execution.total_tokens,
      cost: execution.total_cost,
    })

    // Save execution to database
    const { error: insertError } = await supabase
      .from("agent_executions")
      .insert({
        agent_id: config.id,
        widget_id: widgetId,
        user_prompt: userPrompt,
        context,
        steps: execution.steps,
        outcome: execution.outcome,
        status: execution.status,
        total_tokens: execution.total_tokens,
        total_cost: execution.total_cost,
        duration_ms: execution.duration_ms,
        error: execution.error,
        started_at: new Date(execution.duration_ms ? Date.now() - execution.duration_ms : Date.now()).toISOString(),
        completed_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("[Agent Execute] Failed to save execution:", insertError)
      // Don't fail the request, just log the error
    }

    // Track API usage for Claude
    try {
      await supabase.from("api_usage").insert({
        user_id: user.id,
        provider: "anthropic",
        model: config.model,
        endpoint: "/api/agents/execute",
        input_tokens: Math.floor(execution.total_tokens * 0.4), // Estimate
        output_tokens: Math.floor(execution.total_tokens * 0.6), // Estimate
        total_tokens: execution.total_tokens,
        estimated_cost: execution.total_cost.toString(),
      })
    } catch (usageError) {
      console.error("[Agent Execute] Failed to track usage:", usageError)
    }

    return NextResponse.json({
      success: true,
      execution,
    })
  } catch (error: any) {
    console.error("[Agent Execute] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to execute agent" },
      { status: 500 }
    )
  }
}

/**
 * Get Agent Execution by ID
 * GET /api/agents/execute?executionId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const executionId = searchParams.get("executionId")

    if (!executionId) {
      return NextResponse.json(
        { error: "executionId is required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get execution from database
    const { data: execution, error } = await supabase
      .from("agent_executions")
      .select("*")
      .eq("id", executionId)
      .single()

    if (error || !execution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ execution })
  } catch (error: any) {
    console.error("[Agent Execute GET] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get execution" },
      { status: 500 }
    )
  }
}
