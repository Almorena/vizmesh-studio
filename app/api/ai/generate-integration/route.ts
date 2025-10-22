import { NextRequest, NextResponse } from "next/server"
import { openai, OPENAI_MODEL } from "@/lib/ai/openai"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[AI Integration] Generating from:", prompt)

    // Step 1: Ricerca informazioni sull'API se necessario
    let webContext = ""
    const needsResearch = !isKnownProvider(prompt.toLowerCase())

    if (needsResearch) {
      console.log("[AI Integration] Researching unknown API...")
      try {
        const searchQuery = extractAPIName(prompt) + " API documentation authentication endpoints"
        const searchResults = await searchWeb(searchQuery)
        webContext = `\n\n=== WEB SEARCH RESULTS ===\n${searchResults}\n`
      } catch (error) {
        console.error("[AI Integration] Web search failed:", error)
        // Continue without web context
      }
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert integration configuration assistant for VizMesh Studio. Your job is to analyze user requests and generate complete, production-ready integration configurations.

${webContext ? "You have access to web search results about the API the user is asking for. Use this information to provide accurate configuration." : ""}

You must understand:
1. What type of integration is needed (API, Database, Agent, Custom)
2. What authentication method is required (OAuth, API Key, Basic Auth, JWT, etc.)
3. All necessary endpoints, scopes, and parameters
4. Best practices for each provider

Return valid JSON in this exact format:
{
  "name": "Integration Name",
  "type": "api" | "agent" | "database" | "custom",
  "config": {
    // Complete configuration with ALL necessary fields
  },
  "authType": "oauth" | "apikey" | "basic" | "jwt" | "none",
  "description": "Brief description of what this integration does"
}

=== AUTHENTICATION TYPES ===

OAuth 2.0 Providers (require clientId, clientSecret, scopes):
- Spotify, GitHub, Google, Microsoft, Twitter, LinkedIn, Discord, Twitch

API Key Providers (require apiKey):
- OpenWeatherMap, Last.fm, News API, TMDB, Alpha Vantage, Giphy

Basic Auth Providers (require username, password):
- Most databases, custom APIs

JWT Providers (require token):
- Custom backend APIs, Firebase

=== COMPREHENSIVE EXAMPLES ===

User: "Connect to Spotify to get my music data"
{
  "name": "Spotify",
  "type": "api",
  "config": {
    "provider": "spotify",
    "clientId": "YOUR_SPOTIFY_CLIENT_ID",
    "clientSecret": "YOUR_SPOTIFY_CLIENT_SECRET",
    "scopes": [
      "user-top-read",
      "user-read-recently-played",
      "user-library-read",
      "user-read-playback-state"
    ],
    "baseUrl": "https://api.spotify.com/v1"
  },
  "authType": "oauth",
  "description": "Access your Spotify listening history, top tracks, and playlists"
}

User: "I want weather data from OpenWeatherMap"
{
  "name": "OpenWeatherMap",
  "type": "api",
  "config": {
    "provider": "openweathermap",
    "apiKey": "YOUR_OPENWEATHERMAP_API_KEY",
    "baseUrl": "https://api.openweathermap.org/data/2.5",
    "endpoints": {
      "current": "weather",
      "forecast": "forecast",
      "onecall": "onecall"
    },
    "units": "metric"
  },
  "authType": "apikey",
  "description": "Get current weather, forecasts, and historical weather data"
}

User: "Connect to GitHub API"
{
  "name": "GitHub",
  "type": "api",
  "config": {
    "provider": "github",
    "clientId": "YOUR_GITHUB_CLIENT_ID",
    "clientSecret": "YOUR_GITHUB_CLIENT_SECRET",
    "scopes": ["repo", "user", "read:org"],
    "baseUrl": "https://api.github.com"
  },
  "authType": "oauth",
  "description": "Access GitHub repositories, issues, pull requests, and user data"
}

User: "News API for latest news"
{
  "name": "News API",
  "type": "api",
  "config": {
    "provider": "newsapi",
    "apiKey": "YOUR_NEWSAPI_KEY",
    "baseUrl": "https://newsapi.org/v2",
    "endpoints": {
      "topHeadlines": "top-headlines",
      "everything": "everything",
      "sources": "sources"
    },
    "defaultCountry": "us",
    "defaultPageSize": 20
  },
  "authType": "apikey",
  "description": "Get breaking news headlines and search articles from news sources"
}

User: "Connect to Last.fm for music data"
{
  "name": "Last.fm",
  "type": "api",
  "config": {
    "provider": "lastfm",
    "apiKey": "YOUR_LASTFM_API_KEY",
    "baseUrl": "https://ws.audioscrobbler.com/2.0",
    "endpoints": {
      "userRecentTracks": "?method=user.getrecenttracks",
      "userTopAlbums": "?method=user.gettopalbums",
      "userTopArtists": "?method=user.gettopartists",
      "chartTopTracks": "?method=chart.gettoptracks",
      "trackInfo": "?method=track.getinfo"
    }
  },
  "authType": "apikey",
  "description": "Access Last.fm music scrobbling data, user listening history, and music charts"
}

User: "Connect to my PostgreSQL database"
{
  "name": "PostgreSQL Database",
  "type": "database",
  "config": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "YOUR_DATABASE_NAME",
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD",
    "ssl": false
  },
  "authType": "basic",
  "description": "Connect to PostgreSQL database for custom queries"
}

User: "LangGraph agent for data analysis"
{
  "name": "Data Analysis Agent",
  "type": "agent",
  "config": {
    "agentId": "YOUR_AGENT_ID",
    "apiUrl": "https://your-agent-endpoint.com/invoke",
    "apiKey": "YOUR_AGENT_API_KEY",
    "model": "gpt-4-turbo-preview",
    "temperature": 0.7
  },
  "authType": "apikey",
  "description": "AI agent for analyzing data and generating insights"
}

User: "TMDB for movie data"
{
  "name": "The Movie Database",
  "type": "api",
  "config": {
    "provider": "tmdb",
    "apiKey": "YOUR_TMDB_API_KEY",
    "baseUrl": "https://api.themoviedb.org/3",
    "endpoints": {
      "popular": "movie/popular",
      "topRated": "movie/top_rated",
      "search": "search/movie",
      "details": "movie/{id}"
    },
    "imageBaseUrl": "https://image.tmdb.org/t/p/w500"
  },
  "authType": "apikey",
  "description": "Access movie information, ratings, and images"
}

User: "Custom REST API at https://myapi.com with JWT"
{
  "name": "Custom API",
  "type": "api",
  "config": {
    "provider": "custom",
    "baseUrl": "https://myapi.com/api/v1",
    "token": "YOUR_JWT_TOKEN",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "authType": "jwt",
  "description": "Custom REST API with JWT authentication"
}

User: "Discord bot API"
{
  "name": "Discord",
  "type": "api",
  "config": {
    "provider": "discord",
    "clientId": "YOUR_DISCORD_CLIENT_ID",
    "clientSecret": "YOUR_DISCORD_CLIENT_SECRET",
    "botToken": "YOUR_BOT_TOKEN",
    "scopes": ["identify", "guilds", "messages.read"],
    "baseUrl": "https://discord.com/api/v10"
  },
  "authType": "oauth",
  "description": "Access Discord servers, messages, and user data"
}

User: "Webhook from Zapier"
{
  "name": "Zapier Webhook",
  "type": "custom",
  "config": {
    "webhookUrl": "YOUR_ZAPIER_WEBHOOK_URL",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "authType": "none",
  "description": "Receive data from Zapier automations"
}

=== INSTRUCTIONS ===

1. Analyze the user's request to identify:
   - The service/provider they want to connect to
   - What data they want to access
   - Any specific requirements mentioned

2. Determine the correct authentication type:
   - OAuth: For services requiring user authorization (Spotify, GitHub, etc.)
   - API Key: For services with simple key-based auth (Weather, News, etc.)
   - Basic Auth: For databases and services with username/password
   - JWT: For custom APIs using JWT tokens
   - None: For public APIs or webhooks

3. Include ALL necessary configuration fields:
   - Base URL (always include for APIs)
   - Authentication credentials (with placeholder values)
   - Scopes (for OAuth providers)
   - Common endpoints (if applicable)
   - Default parameters (units, language, page size, etc.)

4. Use realistic placeholder values:
   - "YOUR_SERVICENAME_API_KEY" for API keys
   - "YOUR_SERVICENAME_CLIENT_ID" for OAuth client IDs
   - "YOUR_SERVICENAME_CLIENT_SECRET" for OAuth secrets
   - Actual default values for non-sensitive fields

5. Provide a clear, concise description of what the integration enables

6. Return ONLY valid JSON, no additional text

IMPORTANT:
- Be intelligent about recognizing common services (Spotify, GitHub, Weather APIs, etc.)
- Always include baseUrl for API integrations
- For OAuth providers, include appropriate scopes
- For databases, include connection parameters
- Make configurations complete and ready to use (just need credentials filled in)`
        },
        {
          role: "user",
          content: `Generate integration config for: ${prompt}${webContext}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const responseText = completion.choices[0]?.message?.content || ""
    const config = JSON.parse(responseText)

    console.log("[AI Integration] Generated:", config)

    return NextResponse.json(config)
  } catch (error: any) {
    console.error("[AI Integration] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate integration" },
      { status: 500 }
    )
  }
}

/**
 * Check if the provider is in our known list
 */
function isKnownProvider(prompt: string): boolean {
  const knownProviders = [
    'spotify', 'github', 'google', 'microsoft', 'twitter', 'linkedin',
    'discord', 'twitch', 'lastfm', 'last.fm', 'openweathermap', 'weather',
    'newsapi', 'news', 'tmdb', 'giphy', 'alpha vantage', 'stripe',
    'postgresql', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase'
  ]

  return knownProviders.some(provider => prompt.includes(provider))
}

/**
 * Extract API name from user prompt
 */
function extractAPIName(prompt: string): string {
  // Try to extract the main service name
  const words = prompt.toLowerCase().split(/\s+/)

  // Look for common patterns like "connect to X", "integrate with X", "X API"
  const patterns = [
    /(?:connect to|integrate with|use)\s+(\w+)/i,
    /(\w+)\s+api/i,
    /(\w+)/i
  ]

  for (const pattern of patterns) {
    const match = prompt.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return words[0] || 'API'
}

/**
 * Search the web for API documentation
 */
async function searchWeb(query: string): Promise<string> {
  try {
    // Use a simple web search to get API documentation
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`)

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()

    // Extract relevant information from search results
    let results = ''

    if (data.AbstractText) {
      results += `Summary: ${data.AbstractText}\n\n`
    }

    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      results += 'Related Information:\n'
      data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
        if (topic.Text) {
          results += `- ${topic.Text}\n`
        }
      })
    }

    return results || 'No search results found. Using AI knowledge only.'
  } catch (error) {
    console.error('[Web Search] Error:', error)
    return 'Web search unavailable. Using AI knowledge only.'
  }
}
