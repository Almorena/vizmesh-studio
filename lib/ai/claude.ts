import Anthropic from "@anthropic-ai/sdk"

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Using Claude 2.1 - fallback for older API keys
export const CLAUDE_MODEL = "claude-2.1"
