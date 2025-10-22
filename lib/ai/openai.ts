import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Using GPT-4o - latest model, excellent for code generation and following instructions
export const OPENAI_MODEL = "gpt-4o"
