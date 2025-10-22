import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { calculateThirdPartyCost, isFreAPI } from "@/lib/utils/api-usage"

/**
 * Data Fetching Endpoint
 * Fetches data from configured integrations (APIs, databases, agents)
 */
export async function POST(req: NextRequest) {
  try {
    const { sourceId, endpoint, params } = await req.json()

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      )
    }

    console.log("[Fetch Data] Request:", { sourceId, endpoint, params })

    // Get the integration config from database
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: source, error: sourceError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("id", sourceId)
      .eq("user_id", user.id)
      .single()

    if (sourceError || !source) {
      console.error("[Fetch Data] Source not found:", sourceError)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      )
    }

    console.log("[Fetch Data] Found source:", source.name, source.type)

    // Route to appropriate handler based on type
    let data

    // Handle both new generic types and legacy specific types (spotify, lastfm, etc)
    const normalizedType = source.type.toLowerCase()

    if (normalizedType === "api" || normalizedType === "spotify" || normalizedType === "lastfm" || normalizedType === "github") {
      // All API-based integrations
      data = await fetchFromAPI(source.config, endpoint, params)
    } else if (normalizedType === "agent") {
      data = await fetchFromAgent(source.config, params)
    } else if (normalizedType === "database") {
      data = await fetchFromDatabase(source.config, params)
    } else if (normalizedType === "custom") {
      data = await fetchFromCustom(source.config, params)
    } else {
      throw new Error(`Unsupported integration type: ${source.type}`)
    }

    console.log("[Fetch Data] Success, records:", Array.isArray(data) ? data.length : "N/A")

    // Track API usage for paid third-party APIs only
    try {
      const provider = source.config.provider || source.name

      console.log(`[Fetch Data] Checking provider: "${provider}" - isFree: ${isFreAPI(provider)}`)

      // Skip tracking for free APIs
      if (!isFreAPI(provider)) {
        const cost = calculateThirdPartyCost(provider)

        // Only track if there's a cost
        if (cost > 0) {
          await supabase.from('api_usage').insert({
            user_id: user.id,
            provider: 'third-party',
            model: provider,
            endpoint: `/api/fetch-data/${endpoint || 'default'}`,
            input_tokens: 0,  // Not token-based
            output_tokens: 0,  // Not token-based
            total_tokens: 1,  // Use 1 to represent 1 API request
            estimated_cost: cost.toString()
          })

          console.log(`[Fetch Data] Tracked usage: ${provider} - $${cost}`)
        } else {
          console.log(`[Fetch Data] Skipped tracking (free API): ${provider}`)
        }
      } else {
        console.log(`[Fetch Data] Skipped tracking (free API): ${provider}`)
      }
    } catch (usageError) {
      // Don't fail the request if usage tracking fails
      console.error("[Fetch Data] Failed to track usage:", usageError)
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[Fetch Data] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    )
  }
}

/**
 * Fetch data from REST API
 */
async function fetchFromAPI(
  config: any,
  endpoint?: string,
  params?: any
): Promise<any> {
  let { baseUrl, apiKey, headers: configHeaders } = config
  const provider = config.provider?.toLowerCase()

  console.log("[API Fetch] Provider:", provider, "Type:", config.type, "BaseURL:", baseUrl)

  // Fallback baseUrls for common providers
  if (!baseUrl || baseUrl.includes('PERPLEXITY_API_URL') || baseUrl === 'PERPLEXITY_API_URL') {
    const providerDefaults: Record<string, string> = {
      spotify: "https://api.spotify.com/v1",
      lastfm: "https://ws.audioscrobbler.com/2.0",
      github: "https://api.github.com",
      jsonplaceholder: "https://jsonplaceholder.typicode.com",
      perplexity: "https://api.perplexity.ai"
    }
    if (provider && providerDefaults[provider]) {
      baseUrl = providerDefaults[provider]
    }
  }

  // Detect Perplexity by provider name or baseUrl
  const isPerplexity = provider === 'perplexity' ||
                       (baseUrl && baseUrl.includes('perplexity.ai'))

  // Special handling for Perplexity (chat-based API)
  if (isPerplexity) {
    console.log("[API Fetch] Detected Perplexity, using chat endpoint")
    return await fetchFromPerplexity(baseUrl || "https://api.perplexity.ai", apiKey, params)
  }

  if (!baseUrl || baseUrl.includes('PERPLEXITY_API_URL')) {
    const errorMsg = config.provider
      ? `API baseUrl is required for provider "${config.provider}". Please update your integration configuration.`
      : "API baseUrl is required in config. Please add a baseUrl or specify a known provider (spotify, github, openweathermap, etc.)"
    throw new Error(errorMsg)
  }

  // Build URL
  let url = baseUrl
  if (endpoint) {
    // Remove trailing slash from baseUrl
    const cleanBaseUrl = baseUrl.replace(/\/$/, "")
    // Remove leading slash from endpoint
    const cleanEndpoint = endpoint.replace(/^\//, "")

    // Special handling for Last.fm: endpoints start with "?" so don't add extra "/"
    if (cleanEndpoint.startsWith("?")) {
      url = `${cleanBaseUrl}${cleanEndpoint}`
    } else {
      url = `${cleanBaseUrl}/${cleanEndpoint}`
    }
  }

  // Add query params
  const queryParams = new URLSearchParams(params?.query || {})

  // Some APIs use apiKey as query parameter instead of header
  if (provider === "openweathermap" && apiKey) {
    queryParams.set("appid", apiKey)
    if (config.units) queryParams.set("units", config.units)
  } else if (provider === "lastfm" && apiKey) {
    // Last.fm requires api_key and format params
    // But ONLY add them if they're not already in the URL
    if (!url.includes("api_key=")) {
      queryParams.set("api_key", apiKey)
    } else {
      // Replace placeholder api_key with real one
      url = url.replace(/api_key=YOUR_API_KEY/g, `api_key=${apiKey}`)
    }
    if (!url.includes("format=")) {
      queryParams.set("format", "json")
    }
  }

  if (queryParams.toString()) {
    // Check if URL already has query params
    if (url.includes("?")) {
      url = `${url}&${queryParams.toString()}`
    } else {
      url = `${url}?${queryParams.toString()}`
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...configHeaders,
  }

  // Handle different authentication types
  if (config.accessToken) {
    // OAuth 2.0 - use access token
    headers["Authorization"] = `Bearer ${config.accessToken}`
  } else if (config.token) {
    // JWT - use token directly
    headers["Authorization"] = `Bearer ${config.token}`
  } else if (apiKey) {
    // API Key - can be Bearer or custom header depending on provider
    if (provider === "openweathermap" || provider === "lastfm") {
      // OpenWeatherMap and Last.fm use query param, not header
      // Already added to URL params above
    } else if (provider === "newsapi") {
      headers["X-Api-Key"] = apiKey
    } else if (provider === "nextatlas") {
      // Nextatlas uses X-API-Key header
      headers["X-API-Key"] = apiKey
    } else {
      // Default: Bearer token
      headers["Authorization"] = `Bearer ${apiKey}`
    }
  } else if (config.username && config.password) {
    // Basic Auth
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString("base64")
    headers["Authorization"] = `Basic ${credentials}`
  }

  // Determine HTTP method and body
  let method = params?.method || "GET"
  let body: string | undefined = params?.body ? JSON.stringify(params.body) : undefined

  // Special handling for Nextatlas: always POST with required body structure
  if (provider === "nextatlas" && endpoint?.includes("/search/nextatlas/outcomes")) {
    method = "POST"
    // Build body from params or use defaults
    const requestBody = {
      request: params?.request || params?.query || "latest trends",
      concepts: params?.concepts || [],
      countries: params?.countries || null,
      months_back: params?.months_back || 6
    }
    body = JSON.stringify(requestBody)
  }

  console.log("[API Fetch] Calling:", url)
  console.log("[API Fetch] Headers:", headers)
  console.log("[API Fetch] Method:", method)
  if (body) console.log("[API Fetch] Body:", body)

  const response = await fetch(url, {
    method,
    headers,
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[API Fetch] FAILED: ${response.status}`)
    console.error(`[API Fetch] URL was: ${url}`)
    console.error(`[API Fetch] Response: ${errorText}`)
    throw new Error(`API request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  // Log detailed response for debugging (especially for Nextatlas)
  if (provider === "nextatlas") {
    console.log("[API Fetch] Nextatlas Response Structure:", {
      hasResults: !!data.results,
      resultsType: Array.isArray(data.results) ? 'array' : typeof data.results,
      resultsLength: Array.isArray(data.results) ? data.results.length : 'n/a',
      totalCount: data.total_count,
      hasQuery: !!data.query,
      timestamp: data.timestamp,
      sampleData: Array.isArray(data.results) && data.results.length > 0
        ? data.results[0]
        : data.results
    })
  }

  return data
}

/**
 * Fetch data from Agent (LangGraph, custom AI agent)
 */
async function fetchFromAgent(config: any, params?: any): Promise<any> {
  const { agentId, apiUrl, apiKey } = config

  if (!apiUrl) {
    throw new Error("Agent apiUrl is required in config")
  }

  console.log("[Agent Fetch] Calling agent:", agentId)

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      agent_id: agentId,
      input: params?.input || {},
      config: params?.config || {},
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Agent request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Fetch data from Database
 * NOTE: For security, consider using a proxy/middleware instead of direct DB access
 */
async function fetchFromDatabase(config: any, params?: any): Promise<any> {
  const { type, connectionString, query } = config

  // For security reasons, we don't execute arbitrary SQL queries from the frontend
  // Instead, we would typically:
  // 1. Use a predefined set of safe queries
  // 2. Use an ORM with parameterized queries
  // 3. Route through a backend service

  throw new Error(
    "Database direct access not implemented for security reasons. " +
    "Please use API endpoints or custom middleware."
  )
}

/**
 * Fetch data from Custom source
 */
async function fetchFromCustom(config: any, params?: any): Promise<any> {
  // Custom integrations can implement their own logic
  // For now, return static data or call a webhook

  if (config.webhookUrl) {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    })

    if (!response.ok) {
      throw new Error(`Custom source request failed: ${response.status}`)
    }

    return await response.json()
  }

  // Fallback to static data if provided
  if (config.staticData) {
    return config.staticData
  }

  throw new Error("Custom source requires webhookUrl or staticData in config")
}

/**
 * Fetch data from Perplexity (chat-based API)
 */
async function fetchFromPerplexity(baseUrl: string, apiKey: string, params?: any): Promise<any> {
  if (!apiKey) {
    throw new Error("Perplexity API key is required")
  }

  const query = params?.query || "latest tech news"

  console.log("[Perplexity] Fetching with query:", query)

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides structured data. Always respond with valid JSON only, no markdown or explanations."
        },
        {
          role: "user",
          content: `${query}. Respond with a JSON array of objects, each containing: title, description, url, publishedAt. Example: [{"title":"...", "description":"...", "url":"...", "publishedAt":"..."}]`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Perplexity] Error:", errorText)
    throw new Error(`Perplexity API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("No content returned from Perplexity")
  }

  // Try to parse the JSON response
  try {
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsedData = JSON.parse(cleanContent)
    console.log("[Perplexity] Parsed data:", parsedData)
    return parsedData
  } catch (error) {
    console.error("[Perplexity] Failed to parse response:", content)
    // Return a structured error message
    return [{
      title: "Perplexity Response",
      description: content,
      url: "#",
      publishedAt: new Date().toISOString()
    }]
  }
}
