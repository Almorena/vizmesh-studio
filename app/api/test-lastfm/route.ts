import { NextResponse } from "next/server"

/**
 * Test endpoint per verificare Last.fm
 */
export async function GET() {
  try {
    // IMPORTANTE: Metti qui la tua vera API key di Last.fm
    const API_KEY = "1ac8bf8a19b87582a713f299fb8187e7"

    // Test con endpoint chart.gettoptracks (non richiede username)
    const url = `https://ws.audioscrobbler.com/2.0?method=chart.gettoptracks&limit=10&api_key=${API_KEY}&format=json`

    console.log("[Test Last.fm] Calling:", url)

    const response = await fetch(url)
    const data = await response.json()

    console.log("[Test Last.fm] Success!")
    console.log("[Test Last.fm] Data:", JSON.stringify(data, null, 2))

    return NextResponse.json({
      success: true,
      url,
      data
    })
  } catch (error: any) {
    console.error("[Test Last.fm] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
