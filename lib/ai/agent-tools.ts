/**
 * Agent Tools
 * Predefined tool definitions for agents
 */

import { AgentTool } from "./agent-executor"

// =============================================
// SPOTIFY TOOLS
// =============================================

export const spotifyTools: AgentTool[] = [
  {
    type: "integration",
    name: "spotify_get_top_tracks",
    description: "Get user's top tracks from Spotify. Returns the most played tracks with details like name, artist, album, and popularity.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          enum: ["me/top/tracks"],
          description: "Spotify API endpoint",
        },
        params: {
          type: "object",
          properties: {
            query: {
              type: "object",
              properties: {
                time_range: {
                  type: "string",
                  enum: ["short_term", "medium_term", "long_term"],
                  description: "Time range: short_term (4 weeks), medium_term (6 months), long_term (years)",
                },
                limit: {
                  type: "number",
                  description: "Number of tracks to return (1-50)",
                },
              },
            },
          },
        },
      },
      required: ["endpoint"],
    },
  },
  {
    type: "integration",
    name: "spotify_get_top_artists",
    description: "Get user's top artists from Spotify. Returns the most listened-to artists with details like name, genres, and popularity.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          enum: ["me/top/artists"],
          description: "Spotify API endpoint",
        },
        params: {
          type: "object",
          properties: {
            query: {
              type: "object",
              properties: {
                time_range: {
                  type: "string",
                  enum: ["short_term", "medium_term", "long_term"],
                  description: "Time range for top artists",
                },
                limit: {
                  type: "number",
                  description: "Number of artists to return (1-50)",
                },
              },
            },
          },
        },
      },
      required: ["endpoint"],
    },
  },
  {
    type: "integration",
    name: "spotify_get_recently_played",
    description: "Get user's recently played tracks from Spotify. Returns the last played tracks with timestamps.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          enum: ["me/player/recently-played"],
          description: "Spotify API endpoint",
        },
        params: {
          type: "object",
          properties: {
            query: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Number of tracks (1-50)",
                },
              },
            },
          },
        },
      },
      required: ["endpoint"],
    },
  },
]

// =============================================
// LAST.FM TOOLS
// =============================================

export const lastfmTools: AgentTool[] = [
  {
    type: "integration",
    name: "lastfm_get_artist_info",
    description: "Get detailed information about an artist from Last.fm including bio, tags, and similar artists.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Last.fm query string (e.g., '?method=artist.getinfo&artist=Coldplay')",
        },
        params: {
          type: "object",
          properties: {},
        },
      },
      required: ["endpoint"],
    },
  },
  {
    type: "integration",
    name: "lastfm_get_top_tags",
    description: "Get top tags/genres for an artist from Last.fm. Useful for understanding music genres and categorization.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Last.fm query string (e.g., '?method=artist.gettoptags&artist=Radiohead')",
        },
        params: {
          type: "object",
          properties: {},
        },
      },
      required: ["endpoint"],
    },
  },
  {
    type: "integration",
    name: "lastfm_get_similar_artists",
    description: "Find similar artists to a given artist using Last.fm's algorithm.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Last.fm query string (e.g., '?method=artist.getsimilar&artist=TheWeeknd')",
        },
        params: {
          type: "object",
          properties: {},
        },
      },
      required: ["endpoint"],
    },
  },
]

// =============================================
// NEXTATLAS TOOLS
// =============================================

export const nextatlasTools: AgentTool[] = [
  {
    type: "integration",
    name: "nextatlas_search_trends",
    description: "Search for emerging trends and cultural signals using Nextatlas AI. Useful for finding what's trending in specific industries or topics.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          enum: ["/search/nextatlas/outcomes"],
          description: "Nextatlas API endpoint",
        },
        params: {
          type: "object",
          properties: {
            request: {
              type: "string",
              description: "Search query (e.g., 'indie music trends', 'fashion sustainability')",
            },
            concepts: {
              type: "array",
              items: { type: "string" },
              description: "Related concepts to focus the search",
            },
            months_back: {
              type: "number",
              description: "Number of months to look back (default: 6)",
            },
          },
          required: ["request"],
        },
      },
      required: ["endpoint", "params"],
    },
  },
]

// =============================================
// GITHUB TOOLS
// =============================================

export const githubTools: AgentTool[] = [
  {
    type: "integration",
    name: "github_get_user_repos",
    description: "Get user's GitHub repositories with details like stars, language, and description.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "GitHub API endpoint (e.g., 'users/username/repos')",
        },
        params: {
          type: "object",
          properties: {
            query: {
              type: "object",
              properties: {
                sort: {
                  type: "string",
                  enum: ["created", "updated", "pushed", "full_name"],
                },
                direction: {
                  type: "string",
                  enum: ["asc", "desc"],
                },
                per_page: {
                  type: "number",
                },
              },
            },
          },
        },
      },
      required: ["endpoint"],
    },
  },
]

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get tool by name from all available tools
 */
export function getToolByName(name: string): AgentTool | undefined {
  const allTools = [
    ...spotifyTools,
    ...lastfmTools,
    ...nextatlasTools,
    ...githubTools,
  ]
  return allTools.find((tool) => tool.name === name)
}

/**
 * Get tools for a specific integration type
 */
export function getToolsForIntegration(integrationType: string): AgentTool[] {
  switch (integrationType.toLowerCase()) {
    case "spotify":
      return spotifyTools
    case "lastfm":
    case "last.fm":
      return lastfmTools
    case "nextatlas":
      return nextatlasTools
    case "github":
      return githubTools
    default:
      return []
  }
}

/**
 * Build tools list from integration IDs
 */
export async function buildToolsFromIntegrations(
  integrationIds: string[]
): Promise<AgentTool[]> {
  // This would fetch integration details from database
  // and build appropriate tools with the integration_id set
  // For now, return empty array - implement when needed
  return []
}

/**
 * Get all available tool names
 */
export function getAllToolNames(): string[] {
  return [
    ...spotifyTools.map((t) => t.name),
    ...lastfmTools.map((t) => t.name),
    ...nextatlasTools.map((t) => t.name),
    ...githubTools.map((t) => t.name),
  ]
}
