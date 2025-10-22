import { NextRequest, NextResponse } from "next/server"
import { openai, OPENAI_MODEL } from "@/lib/ai/openai"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { calculateCost } from "@/lib/utils/api-usage"
import type { GenerateWidgetRequest, GenerateWidgetResponse } from "@/lib/types/widget"

/**
 * AI Widget Generation Endpoint
 * Takes a natural language prompt and generates a complete widget using OpenAI GPT-4
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, editMode = false, existingWidget }: GenerateWidgetRequest & {
      editMode?: boolean,
      existingWidget?: { title: string, currentCode: string, dataSource: any }
    } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log(`[AI] ${editMode ? 'Editing' : 'Generating'} widget from prompt:`, prompt)
    if (editMode && existingWidget) {
      console.log("[AI] Existing widget context:", { title: existingWidget.title, codeLength: existingWidget.currentCode?.length })
    }

    // Get user's data sources
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    let availableDataSources: any[] = []
    let dataSourcesWithConfig: any[] = []
    if (user) {
      const { data: sources } = await supabase
        .from("data_sources")
        .select("id, name, type, config")
        .eq("user_id", user.id)
      availableDataSources = sources || []
      dataSourcesWithConfig = sources || []
    }

    // Test integration and analyze data structure
    let dataStructureInfo = ""
    const matchedSource = findMatchingDataSource(prompt, dataSourcesWithConfig)
    if (matchedSource && matchedSource.config) {
      console.log(`[AI Widget] Found matching source: ${matchedSource.name}`)

      try {
        // Call test endpoint to analyze data structure
        console.log(`[AI Widget] Testing integration to analyze data structure...`)
        const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: matchedSource.config })
        })

        if (testResponse.ok) {
          const testData = await testResponse.json()
          console.log(`[AI Widget] Data structure analyzed:`, testData.dataStructure)

          // Build detailed structure information for the AI
          dataStructureInfo = `
=== REAL DATA STRUCTURE ANALYSIS ===
Provider: ${matchedSource.config.provider || matchedSource.type}
Source ID: ${matchedSource.id}

Data Structure:
${JSON.stringify(testData.dataStructure, null, 2)}

Example Data (REAL response from API):
${JSON.stringify(testData.exampleData, null, 2)}

CRITICAL INSTRUCTIONS:
${testData.dataStructure.instructions || 'Use the data structure shown above'}

This data will be automatically normalized and passed to your widget as the 'data' prop.
Generate code that works with THIS EXACT structure!
`
        } else {
          console.warn(`[AI Widget] Failed to test integration: ${testResponse.status}`)
        }
      } catch (error) {
        console.error("[AI Widget] Failed to test integration:", error)
      }
    }

    // Build system prompt with available data sources and structure info
    const systemPrompt = buildSystemPrompt(availableDataSources, dataStructureInfo)

    // Build user prompt with optional existing widget context
    const userPromptContent = editMode && existingWidget
      ? buildEditPrompt(prompt, existingWidget)
      : buildUserPrompt(prompt)

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPromptContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" }, // Force JSON response
    })

    const responseText = completion.choices[0]?.message?.content || ""
    const usage = completion.usage

    // Track API usage
    if (usage) {
      try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const cost = calculateCost(
            'openai',
            OPENAI_MODEL,
            usage.prompt_tokens,
            usage.completion_tokens
          )

          await supabase.from('api_usage').insert({
            user_id: user.id,
            provider: 'openai',
            model: OPENAI_MODEL,
            endpoint: '/api/ai/generate-widget',
            input_tokens: usage.prompt_tokens,
            output_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost: cost
          })

          console.log(`[AI] Tracked usage: ${usage.total_tokens} tokens, $${cost.toFixed(4)}`)
        }
      } catch (trackingError) {
        console.error("[AI] Failed to track usage:", trackingError)
        // Don't fail the request if tracking fails
      }
    }

    // Parse GPT-4's response
    let widgetSpec
    try {
      widgetSpec = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[AI] Failed to parse GPT-4 response:", responseText)
      throw new Error("AI generated invalid widget specification")
    }

    const response: GenerateWidgetResponse = {
      widget: {
        prompt,
        title: widgetSpec.title || "Untitled Widget",
        dataSource: widgetSpec.dataSource || { type: "static", config: {} },
        visualization: widgetSpec.visualization,
      },
      explanation: widgetSpec.explanation || "Widget generated successfully",
      suggestions: widgetSpec.suggestions || [],
    }

    console.log("[AI] Widget generated successfully:", response.widget.title)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[AI] Error generating widget:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate widget" },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(availableDataSources?: any[], apiDocs?: string): string {
  return `You are an AI assistant that generates data visualization widgets based on user requests.

${apiDocs ? `\n=== API DOCUMENTATION ===\n${apiDocs}\n\nUse this documentation to configure the correct endpoints and parameters!\n` : ''}

Your task is to analyze the user's prompt and generate a complete widget specification including:
1. A title for the widget
2. Data source configuration (how to fetch the data)
3. React component code for visualization
4. Explanation of your choices
5. Suggestions for improvements

Available data sources:
${availableDataSources && availableDataSources.length > 0
    ? JSON.stringify(availableDataSources, null, 2) + `

IMPORTANT - Using Real Data Sources:
When a data source is available that matches the user request, USE IT instead of mock data!

For example:
- User asks for "Spotify top tracks" and there's a Spotify API integration → Use that source
- User asks for "music listening history" and there's a Last.fm integration → Use that source
- User asks for "database metrics" and there's a PostgreSQL integration → Use that source

To use a real data source:
1. Set dataSource.type to "api", "agent", "database", or "custom" (matching the source type)
2. Set dataSource.config.sourceId to the source's id (UUID)
3. Optionally set dataSource.config.endpoint for specific API paths (e.g., "/me/top/tracks")
4. Optionally set dataSource.config.params for query parameters or request body

Example using real Spotify data:
{
  "dataSource": {
    "type": "api",
    "config": {
      "sourceId": "abc-123-uuid",
      "endpoint": "/me/top/tracks",
      "params": {
        "query": { "limit": 10, "time_range": "short_term" }
      }
    }
  }
}

Example using real Last.fm data:
{
  "dataSource": {
    "type": "api",
    "config": {
      "sourceId": "lastfm-source-uuid",
      "endpoint": "?method=chart.gettoptracks&limit=10",
      "params": {}
    }
  }
}

CRITICAL Last.fm ENDPOINTS - USE THESE EXACTLY:
- Global top tracks: "?method=chart.gettoptracks&limit=10"
- User recent tracks: "?method=user.getrecenttracks&user=USERNAME&limit=10"
- User top albums: "?method=user.gettopalbums&user=USERNAME&limit=10"
- User top artists: "?method=user.gettopartists&user=USERNAME&limit=10"

Last.fm endpoints MUST start with "?" and include method parameter!

The widget will automatically fetch real data from the integration at runtime!`
    : "None configured yet - use static/mock data with realistic sample values"
  }

You MUST respond with valid JSON in this exact format:
{
  "title": "Widget Title",
  "dataSource": {
    "type": "static",
    "config": {
      "data": [/* array of mock data objects */]
    }
  },
  "visualization": {
    "type": "chart",
    "componentCode": "function Widget({ data }) { return (<div>...</div>); }",
    "props": {}
  },
  "explanation": "Why you chose this visualization",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

CRITICAL GUIDELINES FOR componentCode:
- DO NOT use import statements
- DO NOT use export statements
- DO NOT use template literals with newlines in JSX
- Use regular function declaration: function Widget({ data }) { ... }
- React hooks are available globally: useState, useEffect, useRef
- Chart components are available: BarChart, LineChart, PieChart
- IMPORTANT: The 'data' prop is the actual array/object, NOT wrapped in { data: [...] }
- CRITICAL: Last.fm API responses are AUTOMATICALLY NORMALIZED to arrays
  * Last.fm chart.gettoptracks returns ARRAY of tracks directly (NOT data.tracks.track)
  * Last.fm user.gettopartists returns ARRAY of artists directly (NOT data.artists.artist)
  * Last.fm user.gettopalbums returns ARRAY of albums directly (NOT data.albums.album)
  * The data normalization happens BEFORE your code receives it
  * ALWAYS assume 'data' is already the final array, use it directly: data.map(...)
- CORRECT Example for Bar Chart:
  function Widget({ data }) {
    const chartData = {
      labels: data.map(item => item.name),
      datasets: [{
        label: 'Values',
        data: data.map(item => item.value),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return (
      <div style={{ width: '100%', height: '100%', padding: '10px' }}>
        <BarChart data={chartData} options={options} />
      </div>
    );
  }
- For Line charts use LineChart, for Pie use PieChart
- Always wrap chart in a div with width and height styles
- Use Chart.js data format with labels and datasets
- Keep JSX simple - avoid complex string interpolation

Other Guidelines:
- Generate production-ready React code
- Keep code clean and well-commented
- For static data, include realistic mock data in the dataSource.config.data field
- Make the visualization beautiful and responsive
- You can use HTML elements like <img>, <div>, <h1>, <p>, etc.
- You can use inline styles with style={{ ... }}
- You can combine charts with other elements (images, text, tables)
- For images, use public URLs from Unsplash or similar free image services
- Layout tip: Use flexbox or grid for complex layouts
- IMPORTANT: Return ONLY valid JSON, no markdown code blocks

Example with image and chart:
function Widget({ data }) {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [{
      label: 'Streams',
      data: data.map(item => item.streams),
      backgroundColor: 'rgba(147, 51, 234, 0.5)',
      borderColor: 'rgb(147, 51, 234)',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  return (
    <div style={{ width: '100%', height: '100%', padding: '15px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <img src="https://i.pravatar.cc/80" alt="Artist" style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Artist Name</h3>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <BarChart data={chartData} options={options} />
      </div>
    </div>
  );
}

IMPORTANT SIZE CONSTRAINTS:
- Widget container is approximately 300-500px tall
- Use padding: '15px' max, not '20px' or more
- Images should be small (60px-80px max)
- Use flex: 1 for chart container to fill remaining space
- Always use minHeight: 0 on flex children with charts`
}

function buildUserPrompt(prompt: string): string {
  return `Create a data visualization widget for: "${prompt}"

Generate a complete widget specification that I can use immediately. Return valid JSON only.`
}

function buildEditPrompt(userRequest: string, existingWidget: { title: string, currentCode: string, dataSource: any }): string {
  return `EDIT MODE: Modify an existing widget based on user's request.

**User's Request:** "${userRequest}"

**Current Widget:**
Title: ${existingWidget.title}

**Current React Component Code:**
\`\`\`javascript
${existingWidget.currentCode}
\`\`\`

**Current Data Source:**
\`\`\`json
${JSON.stringify(existingWidget.dataSource, null, 2)}
\`\`\`

**CRITICAL EDITING INSTRUCTIONS:**
1. START with the EXACT current code above
2. Apply ONLY the specific changes requested by the user
3. DO NOT add features the user didn't ask for
4. DO NOT remove existing features unless explicitly requested
5. DO NOT change the data structure or field names unless necessary
6. **DATA SOURCE HANDLING:**
   - If the current dataSource provides the data you need → Keep dataSource unchanged
   - If you need NEW fields not in current data → Check if you can extract/compute them from existing fields
   - Example: If data has "url" field, you can extract domain as source: \`new URL(item.url).hostname\`
   - ONLY modify dataSource if user explicitly asks to change the data query or source
7. Preserve all existing styling, layout, and visual elements
8. Follow the same code guidelines (no imports, no exports, function Widget({ data }) {...})

**What to modify:**
- If user asks to "add" something: ADD it to the existing code without removing anything
- If user asks to "change" something: MODIFY only that specific part
- If user asks to "remove" something: REMOVE only that specific part
- If user asks for "styling": Modify only the CSS/inline styles for the mentioned element

**Example - User asks: "aggiungi per ogni news la fonte, scritta in basso a destra"**
- Current data structure has: title, description, url, publishedAt
- User wants: Add "fonte" (source) extracted from the URL
- Solution: Extract domain from existing "url" field using JavaScript
- Code example to add:
  \`\`\`javascript
  const source = new URL(item.url).hostname.replace('www.', '')
  // Then display: <p style={{ textAlign: 'right', fontSize: '11px', color: '#666' }}>{source}</p>
  \`\`\`
- DO NOT add fields that don't exist in the data (like "summary")
- DO NOT change the dataSource - use existing fields

**IMPORTANT:**
- You are EDITING existing code, not creating from scratch
- Return the COMPLETE updated widget specification with the modified componentCode
- The data structure in 'data' prop remains the same - work with existing fields
- Return valid JSON only

Generate the updated widget specification. Return valid JSON only.`
}

/**
 * Find a data source that matches the user's prompt
 */
function findMatchingDataSource(prompt: string, sources: any[]): any | null {
  if (!sources || sources.length === 0) return null

  const promptLower = prompt.toLowerCase()

  // Try to match by provider name or source name
  for (const source of sources) {
    const sourceName = source.name?.toLowerCase() || ''
    const provider = source.config?.provider?.toLowerCase() || ''

    if (promptLower.includes(sourceName) || promptLower.includes(provider)) {
      return source
    }
  }

  // Try to match by type of data mentioned
  const dataTypeKeywords = {
    'spotify': ['music', 'song', 'track', 'artist', 'album', 'playlist'],
    'lastfm': ['music', 'scrobble', 'listening', 'last.fm'],
    'github': ['repo', 'repository', 'code', 'commit', 'pull request', 'issue'],
    'weather': ['weather', 'temperature', 'forecast'],
    'news': ['news', 'article', 'headline']
  }

  for (const source of sources) {
    const provider = source.config?.provider?.toLowerCase()
    if (provider && dataTypeKeywords[provider]) {
      const keywords = dataTypeKeywords[provider]
      if (keywords.some(kw => promptLower.includes(kw))) {
        return source
      }
    }
  }

  return null
}

/**
 * Search for API documentation
 */
async function searchAPIDocumentation(query: string): Promise<string> {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`)

    if (!response.ok) {
      return ''
    }

    const data = await response.json()

    let docs = ''

    if (data.AbstractText) {
      docs += `Overview: ${data.AbstractText}\n\n`
    }

    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      docs += 'API Information:\n'
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text) {
          docs += `- ${topic.Text}\n`
        }
      })
    }

    return docs || ''
  } catch (error) {
    console.error('[API Docs Search] Error:', error)
    return ''
  }
}
