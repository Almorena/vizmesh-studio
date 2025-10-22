/**
 * Pre-built Integrations Registry
 * Central registry for all native integrations with OAuth and templates
 */

import { SPOTIFY_INTEGRATION, type SpotifyEndpoint } from "./spotify"

export interface Integration {
  id: string
  name: string
  provider: string
  description: string
  icon: string
  color: string
  authType: "oauth2" | "api_key" | "basic"
  baseUrl: string
  scopes?: string[]
  endpoints: any[]
  categories: {
    id: string
    name: string
    icon: string
  }[]
}

/**
 * All available pre-built integrations
 */
export const INTEGRATIONS: Integration[] = [SPOTIFY_INTEGRATION]

/**
 * Get integration by ID
 */
export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((integration) => integration.id === id)
}

/**
 * Get integration by provider
 */
export function getIntegrationByProvider(provider: string): Integration | undefined {
  return INTEGRATIONS.find((integration) => integration.provider === provider)
}

/**
 * Get all OAuth integrations
 */
export function getOAuthIntegrations(): Integration[] {
  return INTEGRATIONS.filter((integration) => integration.authType === "oauth2")
}

// Re-export individual integrations
export { SPOTIFY_INTEGRATION, type SpotifyEndpoint } from "./spotify"
