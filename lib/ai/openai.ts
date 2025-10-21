import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Using GPT-4 Turbo - excellent for code generation
export const OPENAI_MODEL = "gpt-4-turbo-preview"
