import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Test Integration Endpoint
 * Tests an API integration and returns the data structure for widget generation
 */
export async function POST(req: NextRequest) {
  try {
    const { config } = await req.json()

    // Validate required fields
    if (!config) {
      return NextResponse.json(
        { error: "Config is required" },
        { status: 400 }
      )
    }

    console.log("[Test Integration] Testing with config:", {
      provider: config.provider,
      baseUrl: config.baseUrl,
      hasApiKey: !!config.apiKey
    })

    // Call the API based on provider type
    let testResponse
    let dataStructure
    let exampleData

    const provider = config.provider?.toLowerCase()

    // Test Nextatlas
    if (provider === 'nextatlas') {
      testResponse = await testNextatlas(config)
      dataStructure = analyzeNextatlasStructure(testResponse)
      exampleData = testResponse.results?.[0] || null
    }
    // Test generic API
    else {
      testResponse = await testGenericAPI(config)
      dataStructure = analyzeGenericStructure(testResponse)
      exampleData = Array.isArray(testResponse) ? testResponse[0] : testResponse
    }

    console.log("[Test Integration] Success! Structure:", dataStructure)

    return NextResponse.json({
      success: true,
      dataStructure,
      exampleData,
      fullResponse: testResponse
    })
  } catch (error: any) {
    console.error("[Test Integration] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to test integration"
      },
      { status: 500 }
    )
  }
}

/**
 * Test Nextatlas API
 */
async function testNextatlas(config: any) {
  const baseUrl = config.baseUrl || "https://cm-api.nextatlas.com"
  const endpoint = "/api/v1/search/nextatlas/outcomes"

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey
    },
    body: JSON.stringify({
      request: "latest food trends",
      concepts: [],
      countries: null,
      months_back: 6
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Nextatlas API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

/**
 * Test generic API
 */
async function testGenericAPI(config: any) {
  const { baseUrl, apiKey, headers: configHeaders } = config

  if (!baseUrl) {
    throw new Error("Base URL is required")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...configHeaders
  }

  if (config.accessToken) {
    headers["Authorization"] = `Bearer ${config.accessToken}`
  } else if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const response = await fetch(baseUrl, {
    method: "GET",
    headers
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

/**
 * Analyze Nextatlas response structure
 */
function analyzeNextatlasStructure(data: any) {
  return {
    type: "nextatlas",
    description: "Nextatlas Outcomes API response",
    structure: {
      results: "array",
      total_count: "number",
      query: "object",
      timestamp: "string"
    },
    dataPath: "results",
    itemStructure: data.results?.[0] ? Object.keys(data.results[0]) : [],
    totalItems: data.total_count || 0,
    instructions: `
The data comes as an object with a 'results' array.
Each item in results has: ${data.results?.[0] ? Object.keys(data.results[0]).join(', ') : 'unknown fields'}
Access the data using: data[0].fieldName (data is already extracted to the results array)
Example: data[0].title for the first trend title
    `.trim()
  }
}

/**
 * Analyze generic API response structure
 */
function analyzeGenericStructure(data: any) {
  const isArray = Array.isArray(data)
  const firstItem = isArray ? data[0] : data

  return {
    type: "generic",
    description: isArray ? "Array of objects" : "Single object",
    structure: isArray ? "array" : "object",
    itemStructure: firstItem ? Object.keys(firstItem) : [],
    totalItems: isArray ? data.length : 1,
    instructions: isArray
      ? `The data is an array. Access items using data[index].fieldName`
      : `The data is a single object. Access fields using data.fieldName`
  }
}
