# Agent System Documentation

## Overview

The VizMesh Studio Agent System enables **intelligent, multi-step AI workflows** that combine data from multiple sources to generate deep insights. Agents use Claude 3.5 Sonnet with tool calling to:

- 🔄 Orchestrate complex data fetching across integrations
- 🧠 Reason about data and find correlations
- 📊 Generate structured outcomes for widget visualization
- 🎯 Provide actionable insights beyond simple data display

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Request                            │
│  "Analyze my music taste and find emerging trends"          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agent Executor                             │
│  - Claude 3.5 Sonnet with tool calling                       │
│  - Multi-step reasoning loop                                 │
│  - Tool execution and result processing                      │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Spotify │    │ Last.fm │    │Nextatlas│
    │  Tool   │    │  Tool   │    │  Tool   │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         ▼              ▼              ▼
    [Top Artists]  [Genre Tags]  [Trend Data]
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Claude Reasoning Engine     │
          │   - Correlate data            │
          │   - Generate insights         │
          │   - Structure outcome         │
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Structured Outcome          │
          │   {                           │
          │     summary,                  │
          │     insights,                 │
          │     trends,                   │
          │     recommendations           │
          │   }                           │
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │      Widget Rendering         │
          │   - Visualizations            │
          │   - Formatted insights        │
          │   - Interactive UI            │
          └───────────────────────────────┘
```

## Components

### 1. Database Schema (`supabase/migrations/010_agents.sql`)

**`agents` table:**
- Stores reusable agent configurations
- System prompts, model settings, available tools
- Tracked by client_id for multi-tenancy

**`agent_executions` table:**
- Logs every agent run
- Stores execution steps, outcomes, performance metrics
- Links to widgets for outcome display

### 2. Agent Executor (`lib/ai/agent-executor.ts`)

Core engine that executes agents:

```typescript
class AgentExecutor {
  async execute(userPrompt, context) {
    // 1. Initialize conversation with system prompt
    // 2. Start reasoning loop
    while (iteration < maxIterations) {
      // 3. Call Claude with tools
      const response = await claude.messages.create({
        model, system, messages, tools
      })

      // 4. Process response (thinking or tool calls)
      if (response has tool_calls) {
        // 5. Execute tools
        const results = await executeTool(toolName, input)

        // 6. Add results to conversation
        messages.push({ role: "user", content: results })
      } else {
        // 7. Final answer reached
        return extractOutcome(response)
      }
    }
  }
}
```

### 3. Agent Tools (`lib/ai/agent-tools.ts`)

Predefined tool definitions for integrations:

**Spotify Tools:**
- `spotify_get_top_tracks`
- `spotify_get_top_artists`
- `spotify_get_recently_played`

**Last.fm Tools:**
- `lastfm_get_artist_info`
- `lastfm_get_top_tags`
- `lastfm_get_similar_artists`

**Nextatlas Tools:**
- `nextatlas_search_trends`

**GitHub Tools:**
- `github_get_user_repos`

Each tool defines:
- Name and description for Claude
- Input schema (OpenAPI-style)
- Integration ID to fetch data from

### 4. API Endpoint (`app/api/agents/execute/route.ts`)

**POST /api/agents/execute**

Execute an agent:

```json
{
  "agentConfig": {
    "id": "music-trend-analyzer",
    "name": "Music Trend Analyzer",
    "system_prompt": "You are a music analyst...",
    "model": "claude-3-5-sonnet-20241022",
    "available_tools": [...],
    "max_iterations": 15
  },
  "userPrompt": "Analyze my music taste",
  "context": { "detailed_analysis": true },
  "widgetId": "uuid" // optional
}
```

Response:

```json
{
  "success": true,
  "execution": {
    "execution_id": "uuid",
    "steps": [
      {
        "step": 1,
        "type": "tool_call",
        "tool_name": "spotify_get_top_artists",
        "tool_input": {...},
        "timestamp": "2025-01-22T10:00:00Z"
      },
      {
        "step": 2,
        "type": "thinking",
        "content": "User likes indie and alternative rock...",
        "timestamp": "2025-01-22T10:00:05Z"
      }
    ],
    "outcome": {
      "summary": "Your music taste centers on indie rock...",
      "insights": [...],
      "trends": [...],
      "recommendations": [...]
    },
    "status": "completed",
    "total_tokens": 3500,
    "total_cost": 0.0525,
    "duration_ms": 12000
  }
}
```

## Example Agents

### Music Trend Analyzer

Combines Spotify, Last.fm, and Nextatlas to provide deep music insights:

```typescript
{
  name: "Music Trend Analyzer",
  system_prompt: `
    You are an AI music analyst that provides deep insights.

    Workflow:
    1. Get user's top artists from Spotify
    2. Fetch genre/tag info from Last.fm for each artist
    3. Identify main genres user listens to
    4. Search Nextatlas for emerging trends in those genres
    5. Provide comprehensive analysis

    Output JSON:
    {
      "summary": "...",
      "top_genres": [...],
      "insights": [...],
      "trends": [...],
      "recommendations": [...]
    }
  `,
  available_tools: [
    ...spotifyTools,
    ...lastfmTools,
    ...nextatlasTools
  ],
  max_iterations: 15
}
```

**Example execution steps:**

1. **Tool Call**: `spotify_get_top_artists` → Gets ["Tame Impala", "MGMT", "Arctic Monkeys"]
2. **Thinking**: "User likes psychedelic/indie rock. Let me get genre info..."
3. **Tool Call**: `lastfm_get_artist_info` for Tame Impala → Tags: ["psychedelic", "indie", "electronic"]
4. **Tool Call**: `lastfm_get_artist_info` for MGMT → Tags: ["indie", "psychedelic", "electronic"]
5. **Thinking**: "Main genres: psychedelic, indie, electronic. Searching trends..."
6. **Tool Call**: `nextatlas_search_trends` query="psychedelic indie music trends" → Finds "bedroom pop", "hyperpop"
7. **Final Answer**: Structured JSON with insights, trends, recommendations

### GitHub Profile Analyzer

Analyzes GitHub activity and provides recommendations:

```typescript
{
  name: "GitHub Profile Analyzer",
  system_prompt: `
    Analyze GitHub profile and suggest improvements.

    1. Get user's repositories
    2. Analyze languages, diversity, activity, stars
    3. Provide insights and recommendations
  `,
  available_tools: [githubTools],
  max_iterations: 10
}
```

## Use Cases

### 1. Cross-Integration Insights

**Prompt**: "Compare my Spotify top artists with trending genres"

**Agent workflow:**
1. Fetch Spotify top artists
2. Get Last.fm genre tags for each artist
3. Query Nextatlas for trends in those genres
4. Generate comparative analysis

**Outcome**: Widget showing correlation between personal taste and global trends

### 2. Deep Artist Analysis

**Prompt**: "Tell me everything about my #1 artist"

**Agent workflow:**
1. Get top artist from Spotify
2. Fetch Last.fm biography, tags, similar artists
3. Search Nextatlas for trends related to artist's genres
4. Generate comprehensive profile

**Outcome**: Rich artist profile with trends and recommendations

### 3. Music Taste Evolution

**Prompt**: "How has my music taste changed?"

**Agent workflow:**
1. Get Spotify top tracks (short_term vs long_term)
2. Analyze genre distribution over time
3. Find emerging patterns

**Outcome**: Temporal analysis with visualizations

### 4. Developer Portfolio Review

**Prompt**: "Review my GitHub and suggest improvements"

**Agent workflow:**
1. Fetch all repositories
2. Analyze languages, stars, activity
3. Identify strengths and gaps
4. Generate actionable recommendations

**Outcome**: Portfolio analysis with improvement suggestions

## Widget Integration

Agents are designed to generate outcomes that render beautifully in widgets:

```jsx
// Widget receives agent outcome
function AgentOutcomeWidget({ outcome }) {
  return (
    <div>
      <h2>{outcome.summary}</h2>

      <section>
        <h3>Top Genres</h3>
        <GenreChart data={outcome.top_genres} />
      </section>

      <section>
        <h3>Insights</h3>
        {outcome.insights.map(insight => (
          <InsightCard key={insight.title} {...insight} />
        ))}
      </section>

      <section>
        <h3>Emerging Trends</h3>
        <TrendsList trends={outcome.trends} />
      </section>

      <section>
        <h3>Recommendations</h3>
        <RecommendationsList items={outcome.recommendations} />
      </section>
    </div>
  )
}
```

## Performance & Cost

### Token Usage

- Average execution: 2,000-5,000 tokens
- Cost per execution: $0.02-$0.08
- Tracked in `api_usage` table

### Optimization Tips

1. **Limit iterations**: Set `max_iterations` appropriately
2. **Specific prompts**: More specific = fewer tool calls
3. **Cache data**: Use `widget_data_cache` for repeated queries
4. **Batch tool calls**: Agent can call multiple tools in parallel

## Future Enhancements

### Phase 1: MCP Integration ⏳

Add Model Context Protocol support for external data:

```typescript
{
  type: "mcp",
  server: "web-search",
  tool: "search",
  description: "Search the web for information"
}
```

### Phase 2: Custom Tools ⏳

Allow users to define custom JavaScript tools:

```typescript
{
  type: "custom",
  name: "calculate_trend_score",
  implementation: `
    function(input) {
      const { popularity, growth } = input
      return popularity * growth * 100
    }
  `
}
```

### Phase 3: Agent Marketplace ⏳

- Pre-built agents for common use cases
- Community-shared agents
- Agent templates and customization

### Phase 4: Streaming Execution 🔮

- Real-time step updates to frontend
- Progressive widget rendering
- Cancel mid-execution

## Testing

Run the test script to see agents in action:

```bash
pnpm tsx scripts/test-agent.ts
```

Or call the API directly:

```bash
curl -X POST http://localhost:3000/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentConfig": {...},
    "userPrompt": "Analyze my music taste"
  }'
```

## Debugging

Agent executions are fully logged:

1. Check `agent_executions` table for execution history
2. Review `steps` JSONB column for detailed trace
3. Use console logs for real-time debugging:

```
[Agent Music Trend Analyzer] Starting execution
[Agent] Iteration 1
[Agent] Tool call: spotify_get_top_artists
[Agent] Iteration 2
[Agent] Tool call: lastfm_get_artist_info
...
[Agent Execute] Completed: { status: 'completed', steps: 7, tokens: 3421 }
```

## Best Practices

1. **Clear system prompts**: Be specific about workflow and output format
2. **Structured outcomes**: Always return JSON for easy widget rendering
3. **Error handling**: Agents gracefully handle tool failures
4. **Context passing**: Use `context` parameter for user preferences
5. **Cost awareness**: Monitor token usage in production

## API Reference

See `lib/ai/agent-executor.ts` for full TypeScript types and implementation details.

---

**Questions?** Check the test script at `scripts/test-agent.ts` for working examples.
