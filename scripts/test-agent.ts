/**
 * Test Agent Execution
 * This script demonstrates how to create and execute an intelligent agent
 * that combines data from multiple sources
 */

import { spotifyTools, lastfmTools, nextatlasTools } from "../lib/ai/agent-tools"
import { AgentConfig } from "../lib/ai/agent-executor"

// =============================================
// EXAMPLE AGENT CONFIGS
// =============================================

/**
 * Music Trend Analyzer Agent
 * Combines Spotify listening history with Last.fm metadata
 * and Nextatlas trend data to provide intelligent insights
 */
export const musicTrendAnalyzerAgent: AgentConfig = {
  id: "music-trend-analyzer",
  name: "Music Trend Analyzer",
  system_prompt: `You are an AI music analyst that provides deep insights into music listening patterns and trends.

Your capabilities:
- Access user's Spotify listening data (top tracks, top artists, recently played)
- Get detailed artist information from Last.fm (genres, tags, biography)
- Search for emerging trends using Nextatlas AI

Your task:
1. First, get the user's top artists from Spotify
2. For each top artist, fetch genre/tag information from Last.fm
3. Identify the main genres the user listens to
4. Search Nextatlas for emerging trends in those genres
5. Provide a comprehensive analysis with:
   - Summary of user's music taste
   - Emerging trends in their favorite genres
   - Recommendations for new artists/genres to explore
   - Interesting insights and connections

Always provide your final answer as a JSON object with this structure:
{
  "summary": "Brief summary of user's music taste",
  "top_genres": ["genre1", "genre2", ...],
  "insights": [
    { "title": "Insight title", "description": "Detailed insight" }
  ],
  "trends": [
    { "trend": "Trend name", "relevance": "Why it's relevant to the user" }
  ],
  "recommendations": [
    { "type": "artist/genre", "name": "...", "reason": "..." }
  ]
}`,
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  max_tokens: 4000,
  available_tools: [
    ...spotifyTools,
    ...lastfmTools,
    ...nextatlasTools,
  ],
  max_iterations: 15,
}

/**
 * GitHub Profile Analyzer Agent
 * Analyzes GitHub activity and suggests improvements
 */
export const githubAnalyzerAgent: AgentConfig = {
  id: "github-analyzer",
  name: "GitHub Profile Analyzer",
  system_prompt: `You are a software development analyst that reviews GitHub profiles.

Your task:
1. Get the user's repositories
2. Analyze:
   - Most used programming languages
   - Project diversity
   - Activity patterns
   - Popular projects (by stars)
3. Provide insights and recommendations

Return JSON with:
{
  "summary": "Brief profile summary",
  "languages": [{"name": "...", "count": N}],
  "insights": [...],
  "recommendations": [...]
}`,
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  max_tokens: 2000,
  available_tools: [
    {
      type: "integration",
      name: "github_get_user_repos",
      description: "Get user's GitHub repositories",
      input_schema: {
        type: "object",
        properties: {
          endpoint: {
            type: "string",
            description: "GitHub API endpoint",
          },
          params: {
            type: "object",
            properties: {},
          },
        },
        required: ["endpoint"],
      },
    },
  ],
  max_iterations: 10,
}

// =============================================
// TEST EXECUTION EXAMPLE
// =============================================

export const testAgentExecution = async () => {
  console.log("🤖 Testing Agent Execution\n")

  // This would be called from the frontend:
  const response = await fetch("http://localhost:3000/api/agents/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add auth header in real implementation
    },
    body: JSON.stringify({
      agentConfig: musicTrendAnalyzerAgent,
      userPrompt: "Analyze my music taste and tell me about emerging trends",
      context: {
        user_preferences: {
          detailed_analysis: true,
          include_recommendations: true,
        },
      },
    }),
  })

  const result = await response.json()

  console.log("✅ Agent Execution Complete\n")
  console.log("Status:", result.execution.status)
  console.log("Steps:", result.execution.steps.length)
  console.log("Tokens used:", result.execution.total_tokens)
  console.log("Cost:", `$${result.execution.total_cost.toFixed(4)}`)
  console.log("\n📊 Outcome:")
  console.log(JSON.stringify(result.execution.outcome, null, 2))

  return result
}

// =============================================
// EXAMPLE USE CASES
// =============================================

export const exampleUseCases = [
  {
    name: "Music Trend Discovery",
    prompt: "What are the emerging trends in the genres I listen to?",
    agent: "music-trend-analyzer",
    expectedOutcome: "Analysis of user's genres + Nextatlas trend data",
  },
  {
    name: "Artist Deep Dive",
    prompt: "Tell me everything about my top artist and find similar rising artists",
    agent: "music-trend-analyzer",
    expectedOutcome: "Artist bio, tags, similar artists, trends",
  },
  {
    name: "Music Evolution",
    prompt: "How has my music taste evolved over time?",
    agent: "music-trend-analyzer",
    expectedOutcome: "Comparison of short-term vs long-term listening data",
  },
  {
    name: "GitHub Portfolio Review",
    prompt: "Review my GitHub profile and suggest improvements",
    agent: "github-analyzer",
    expectedOutcome: "Analysis of repos, languages, activity, recommendations",
  },
]

// If running directly
if (require.main === module) {
  console.log("🚀 Agent System Test\n")
  console.log("Available Agents:")
  console.log("1. Music Trend Analyzer")
  console.log("2. GitHub Profile Analyzer\n")
  console.log("Example Use Cases:")
  exampleUseCases.forEach((useCase, i) => {
    console.log(`${i + 1}. ${useCase.name}`)
    console.log(`   Prompt: "${useCase.prompt}"`)
    console.log(`   Expected: ${useCase.expectedOutcome}\n`)
  })
  console.log("To test, start the dev server and call /api/agents/execute")
}
