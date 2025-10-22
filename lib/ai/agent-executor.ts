/**
 * Agent Executor
 * Executes AI agents with multi-step reasoning and tool calling
 * Uses Anthropic Claude with tool use capability
 */

import Anthropic from "@anthropic-ai/sdk"

// =============================================
// TYPES
// =============================================

export interface AgentTool {
  type: "integration" | "mcp" | "custom"
  name: string
  description: string
  integration_id?: string // For integration tools
  input_schema: {
    type: "object"
    properties: Record<string, any>
    required?: string[]
  }
}

export interface AgentConfig {
  id: string
  name: string
  system_prompt: string
  model: string
  temperature: number
  max_tokens: number
  available_tools: AgentTool[]
  max_iterations: number
}

export interface ExecutionStep {
  step: number
  type: "thinking" | "tool_call" | "tool_result" | "final_answer"
  content?: string
  tool_name?: string
  tool_input?: any
  tool_output?: any
  timestamp: string
}

export interface AgentExecution {
  execution_id: string
  agent_id: string
  user_prompt: string
  steps: ExecutionStep[]
  outcome?: any
  status: "running" | "completed" | "failed" | "cancelled"
  total_tokens: number
  total_cost: number
  duration_ms: number
  error?: string
}

// =============================================
// AGENT EXECUTOR CLASS
// =============================================

export class AgentExecutor {
  private anthropic: Anthropic
  private config: AgentConfig
  private executionId: string
  private steps: ExecutionStep[] = []
  private startTime: number
  private totalTokens: number = 0

  constructor(config: AgentConfig, executionId: string) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not set")
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    this.config = config
    this.executionId = executionId
    this.startTime = Date.now()
  }

  /**
   * Execute the agent with the given prompt
   */
  async execute(userPrompt: string, context: any = {}): Promise<AgentExecution> {
    console.log(`[Agent ${this.config.name}] Starting execution: ${userPrompt}`)

    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context)

      // Convert tools to Anthropic format
      const tools = this.convertToolsToAnthropicFormat()

      // Start conversation
      let messages: Anthropic.MessageParam[] = [
        {
          role: "user",
          content: userPrompt,
        },
      ]

      let iteration = 0
      let finalAnswer: any = null

      while (iteration < this.config.max_iterations && !finalAnswer) {
        iteration++
        console.log(`[Agent] Iteration ${iteration}`)

        // Call Claude
        const response = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: this.config.max_tokens,
          temperature: this.config.temperature,
          system: systemPrompt,
          messages,
          tools: tools.length > 0 ? tools : undefined,
        })

        // Track tokens
        this.totalTokens += response.usage.input_tokens + response.usage.output_tokens

        // Process response
        const { shouldContinue, toolResults } = await this.processResponse(
          response,
          iteration
        )

        if (!shouldContinue) {
          // Agent has finished - extract final answer
          finalAnswer = this.extractFinalAnswer(response)
          break
        }

        // Add assistant message to conversation
        messages.push({
          role: "assistant",
          content: response.content,
        })

        // Add tool results to conversation
        if (toolResults.length > 0) {
          messages.push({
            role: "user",
            content: toolResults,
          })
        }
      }

      // Calculate metrics
      const duration_ms = Date.now() - this.startTime
      const total_cost = this.calculateCost(this.totalTokens)

      return {
        execution_id: this.executionId,
        agent_id: this.config.id,
        user_prompt: userPrompt,
        steps: this.steps,
        outcome: finalAnswer,
        status: "completed",
        total_tokens: this.totalTokens,
        total_cost,
        duration_ms,
      }
    } catch (error: any) {
      console.error(`[Agent] Error:`, error)

      return {
        execution_id: this.executionId,
        agent_id: this.config.id,
        user_prompt: userPrompt,
        steps: this.steps,
        status: "failed",
        total_tokens: this.totalTokens,
        total_cost: this.calculateCost(this.totalTokens),
        duration_ms: Date.now() - this.startTime,
        error: error.message,
      }
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: any): string {
    let prompt = this.config.system_prompt

    if (Object.keys(context).length > 0) {
      prompt += "\n\n## Context\n"
      prompt += JSON.stringify(context, null, 2)
    }

    return prompt
  }

  /**
   * Convert tools to Anthropic format
   */
  private convertToolsToAnthropicFormat(): Anthropic.Tool[] {
    return this.config.available_tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }))
  }

  /**
   * Process Claude's response
   */
  private async processResponse(
    response: Anthropic.Message,
    iteration: number
  ): Promise<{ shouldContinue: boolean; toolResults: Anthropic.ToolResultBlockParam[] }> {
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type === "text") {
        // Thinking/reasoning step
        this.addStep({
          step: iteration,
          type: "thinking",
          content: block.text,
          timestamp: new Date().toISOString(),
        })
      } else if (block.type === "tool_use") {
        // Tool call step
        console.log(`[Agent] Tool call: ${block.name}`)

        this.addStep({
          step: iteration,
          type: "tool_call",
          tool_name: block.name,
          tool_input: block.input,
          timestamp: new Date().toISOString(),
        })

        // Execute tool
        try {
          const toolOutput = await this.executeTool(block.name, block.input)

          this.addStep({
            step: iteration,
            type: "tool_result",
            tool_name: block.name,
            tool_output: toolOutput,
            timestamp: new Date().toISOString(),
          })

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(toolOutput),
          })
        } catch (error: any) {
          console.error(`[Agent] Tool execution failed:`, error)

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error: ${error.message}`,
            is_error: true,
          })
        }
      }
    }

    // Continue if there were tool calls
    const shouldContinue = toolResults.length > 0

    return { shouldContinue, toolResults }
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    const tool = this.config.available_tools.find((t) => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    switch (tool.type) {
      case "integration":
        return await this.executeIntegrationTool(tool, input)
      case "mcp":
        return await this.executeMCPTool(tool, input)
      case "custom":
        return await this.executeCustomTool(tool, input)
      default:
        throw new Error(`Unknown tool type: ${tool.type}`)
    }
  }

  /**
   * Execute an integration tool (calls /api/fetch-data)
   */
  private async executeIntegrationTool(tool: AgentTool, input: any): Promise<any> {
    if (!tool.integration_id) {
      throw new Error("integration_id required for integration tools")
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/fetch-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: tool.integration_id,
        endpoint: input.endpoint,
        params: input.params,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Integration call failed: ${error}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Execute an MCP tool (Model Context Protocol)
   */
  private async executeMCPTool(tool: AgentTool, input: any): Promise<any> {
    // TODO: Implement MCP integration
    // This would call external MCP servers for web search, etc.
    throw new Error("MCP tools not yet implemented")
  }

  /**
   * Execute a custom tool
   */
  private async executeCustomTool(tool: AgentTool, input: any): Promise<any> {
    // TODO: Implement custom tool execution
    // This would run custom JavaScript functions
    throw new Error("Custom tools not yet implemented")
  }

  /**
   * Extract final answer from response
   */
  private extractFinalAnswer(response: Anthropic.Message): any {
    // Find the last text block as the final answer
    const textBlocks = response.content.filter((block) => block.type === "text")
    if (textBlocks.length === 0) {
      return null
    }

    const lastText = textBlocks[textBlocks.length - 1]
    if (lastText.type !== "text") return null

    // Try to parse as JSON, otherwise return as text
    try {
      return JSON.parse(lastText.text)
    } catch {
      return { text: lastText.text }
    }
  }

  /**
   * Add execution step
   */
  private addStep(step: ExecutionStep): void {
    this.steps.push(step)
  }

  /**
   * Calculate cost based on tokens
   * Using Claude 3.5 Sonnet pricing: $3/M input, $15/M output
   */
  private calculateCost(tokens: number): number {
    // Simplified: use average of input/output price
    const avgPrice = (3 + 15) / 2 / 1_000_000
    return tokens * avgPrice
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Create and execute an agent
 */
export async function executeAgent(
  config: AgentConfig,
  userPrompt: string,
  context: any = {}
): Promise<AgentExecution> {
  const executionId = crypto.randomUUID()
  const executor = new AgentExecutor(config, executionId)
  return await executor.execute(userPrompt, context)
}
