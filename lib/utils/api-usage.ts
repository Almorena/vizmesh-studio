/**
 * API Usage Tracking Utilities
 * Tracks token usage and costs for OpenAI and other paid APIs
 */

// Pricing per 1M tokens (as of January 2024) or per API request for third-party services
export const API_PRICING = {
  openai: {
    'gpt-4-turbo-preview': {
      input: 10.0,  // $10 per 1M input tokens
      output: 30.0, // $30 per 1M output tokens
    },
    'gpt-4': {
      input: 30.0,
      output: 60.0,
    },
    'gpt-3.5-turbo': {
      input: 0.5,
      output: 1.5,
    },
  },
  anthropic: {
    'claude-3-opus': {
      input: 15.0,
      output: 75.0,
    },
    'claude-3-sonnet': {
      input: 3.0,
      output: 15.0,
    },
    'claude-3-5-sonnet-20241022': {
      input: 3.0,  // $3 per 1M input tokens
      output: 15.0, // $15 per 1M output tokens
    },
  },
  // Third-party API services (cost per request)
  'third-party': {
    'perplexity': {
      perRequest: 0.005, // ~$0.005 per request (Perplexity API estimate)
    },
    'default': {
      perRequest: 0.0001, // Default minimal cost for tracking purposes
    },
  },
}

export interface APIUsageRecord {
  id?: string
  user_id: string
  provider: 'openai' | 'anthropic' | 'other'
  model: string
  endpoint: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost: number
  created_at?: string
}

/**
 * Calculate cost for API usage
 */
export function calculateCost(
  provider: keyof typeof API_PRICING,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = API_PRICING[provider]?.[model as keyof typeof API_PRICING[typeof provider]]

  if (!pricing) {
    console.warn(`No pricing found for ${provider}/${model}`)
    return 0
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output

  return inputCost + outputCost
}

// Free APIs that should NOT be tracked in usage
const FREE_APIS = [
  'lastfm',
  'last.fm',
  'jsonplaceholder',
  'openweathermap', // Free tier
  'github', // Free for public repos
  'nextatlas', // Free tier
  'spotify', // Free API (requires auth but no cost)
]

/**
 * Check if an API provider is free (should not be tracked in usage)
 */
export function isFreAPI(apiProvider: string): boolean {
  const normalizedProvider = apiProvider.toLowerCase()
  return FREE_APIS.some(freeApi => normalizedProvider.includes(freeApi))
}

/**
 * Calculate cost for third-party API requests (not token-based)
 * Returns 0 for free APIs
 */
export function calculateThirdPartyCost(apiProvider: string): number {
  const normalizedProvider = apiProvider.toLowerCase()

  // Don't charge for free APIs
  if (isFreAPI(apiProvider)) {
    return 0
  }

  // Map provider names to pricing keys
  if (normalizedProvider.includes('perplexity')) {
    return API_PRICING['third-party']['perplexity'].perRequest
  }

  // Default minimal cost for tracking
  return API_PRICING['third-party']['default'].perRequest
}

/**
 * Format cost as currency
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(cost)
}

/**
 * Format token count with commas
 */
export function formatTokens(tokens: number): string {
  return new Intl.NumberFormat('en-US').format(tokens)
}
