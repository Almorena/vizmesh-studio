import { NextRequest, NextResponse } from "next/server"
import { openai, OPENAI_MODEL } from "@/lib/ai/openai"
import type { GenerateWidgetRequest, GenerateWidgetResponse } from "@/lib/types/widget"

/**
 * AI Widget Generation Endpoint
 * Takes a natural language prompt and generates a complete widget using OpenAI GPT-4
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, availableDataSources }: GenerateWidgetRequest = await req.json()

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log("[AI] Generating widget from prompt:", prompt)

    // Build system prompt with available data sources
    const systemPrompt = buildSystemPrompt(availableDataSources)

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
          content: buildUserPrompt(prompt),
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" }, // Force JSON response
    })

    const responseText = completion.choices[0]?.message?.content || ""

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

function buildSystemPrompt(availableDataSources?: any[]): string {
  return `You are an AI assistant that generates data visualization widgets based on user requests.

Your task is to analyze the user's prompt and generate a complete widget specification including:
1. A title for the widget
2. Data source configuration (how to fetch the data)
3. React component code for visualization
4. Explanation of your choices
5. Suggestions for improvements

Available data sources:
${availableDataSources && availableDataSources.length > 0
    ? JSON.stringify(availableDataSources, null, 2)
    : "None configured yet - use static/mock data"
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
- Use regular function declaration: function Widget({ data }) { ... }
- React hooks are available globally: useState, useEffect, etc.
- Chart components are available: BarChart, LineChart, PieChart, DoughnutChart (react-chartjs-2)
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
      maintainAspectRatio: false
    };

    return (
      <div style={{ height: '300px' }}>
        <BarChart data={chartData} options={options} />
      </div>
    );
  }
- For Line charts use LineChart, for Pie use PieChart, for Doughnut use DoughnutChart
- Always wrap chart in a div with height style
- Use Chart.js data format with labels and datasets

Other Guidelines:
- Generate production-ready React code
- Keep code clean and well-commented
- For static data, include realistic mock data in the dataSource.config.data field
- Make the visualization beautiful and responsive
- IMPORTANT: Return ONLY valid JSON, no markdown code blocks`
}

function buildUserPrompt(prompt: string): string {
  return `Create a data visualization widget for: "${prompt}"

Generate a complete widget specification that I can use immediately. Return valid JSON only.`
}
