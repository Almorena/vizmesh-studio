"use client"

import { useEffect, useState } from "react"
import { WidgetRenderer } from "./widget-renderer"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WidgetTheme } from "@/lib/widget-themes"
import { logger } from "@/lib/utils/logger"

interface WidgetWithDataProps {
  componentCode: string
  dataSource: {
    type: string
    config: any
  }
  cachedData?: any
  theme?: WidgetTheme
  title?: string
  className?: string
  widgetIndex?: number
}

/**
 * Widget component that handles both static and dynamic data
 * Uses cached data from database, only fetches if no cache available
 */
export function WidgetWithData({ componentCode, dataSource, cachedData, theme, title, className, widgetIndex }: WidgetWithDataProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStaticData = dataSource.type === "static"
  const hasSourceId = dataSource.config?.sourceId
  const hasCachedData = cachedData !== null && cachedData !== undefined

  // Debug: log when component mounts or componentCode changes
  useEffect(() => {
    logger.debug("WidgetWithData", "Component mounted/updated, code length:", componentCode?.length)
    logger.debug("WidgetWithData", "Has cached data:", hasCachedData)
  }, [componentCode, hasCachedData])

  useEffect(() => {
    if (hasCachedData) {
      // Use cached data from database (cache-first strategy)
      logger.debug("WidgetWithData", "Using cached data from database")
      logger.debug("WidgetWithData", "Cached data type:", Array.isArray(cachedData) ? 'array' : typeof cachedData)

      // Normalize cached data (in case it has nested structure)
      let normalizedData = cachedData
      if (normalizedData && typeof normalizedData === 'object' && !Array.isArray(normalizedData)) {
        // Nextatlas API returns { results: [...], total_count, query, timestamp }
        if (normalizedData.results && Array.isArray(normalizedData.results)) {
          normalizedData = normalizedData.results
        }
        // Last.fm chart API returns data in nested structure
        else if (normalizedData.tracks?.track) {
          normalizedData = normalizedData.tracks.track
        } else if (normalizedData.artists?.artist) {
          normalizedData = normalizedData.artists.artist
        } else if (normalizedData.albums?.album) {
          normalizedData = normalizedData.albums.album
        } else if (normalizedData.tags?.tag) {
          normalizedData = normalizedData.tags.tag
        } else if (normalizedData.artists && Array.isArray(normalizedData.artists)) {
          // Handle case where we have { artists: [...] } directly (from chart.gettopartists)
          normalizedData = normalizedData.artists
        }
      }

      logger.debug("WidgetWithData", "Normalized cached data type:", Array.isArray(normalizedData) ? 'array' : typeof normalizedData)

      // Safety check: ensure we pass an array to widgets that expect arrays
      if (normalizedData && !Array.isArray(normalizedData) && typeof normalizedData === 'object') {
        logger.warn("WidgetWithData", "Data is still an object after normalization, converting to array")
        logger.debug("WidgetWithData", "Object keys:", Object.keys(normalizedData))
        // Try to extract array from object
        const values = Object.values(normalizedData)
        if (values.length > 0 && Array.isArray(values[0])) {
          logger.debug("WidgetWithData", "Found array in first value, using it")
          normalizedData = values[0]
        } else {
          // Last resort: wrap in array
          logger.debug("WidgetWithData", "Wrapping object in array as last resort")
          normalizedData = [normalizedData]
        }
      }

      logger.debug("WidgetWithData", "Final data being set:", {
        type: Array.isArray(normalizedData) ? 'array' : typeof normalizedData,
        length: Array.isArray(normalizedData) ? normalizedData.length : 'n/a'
      })

      setData(normalizedData)
    } else if (isStaticData) {
      // Static data - use immediately
      setData(dataSource.config.data || dataSource.config)
    } else if (hasSourceId) {
      // Real integration - no cache available, fetch data
      logger.debug("WidgetWithData", "No cache available, fetching from source")
      fetchData()
    } else {
      // Fallback to config data
      setData(dataSource.config.data || dataSource.config || [])
    }
  }, [dataSource, cachedData, hasCachedData])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      logger.debug("WidgetWithData", "Fetching from source:", dataSource.config.sourceId)

      const response = await fetch("/api/fetch-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: dataSource.config.sourceId,
          endpoint: dataSource.config.endpoint,
          params: dataSource.config.params,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch data")
      }

      const result = await response.json()

      // Normalize response structure (Nextatlas, Last.fm, etc.)
      let normalizedData = result.data
      if (normalizedData && typeof normalizedData === 'object') {
        // Nextatlas API returns { results: [...], total_count, query, timestamp }
        if (normalizedData.results && Array.isArray(normalizedData.results)) {
          normalizedData = normalizedData.results
        }
        // Last.fm chart API returns data in nested structure
        else if (normalizedData.tracks?.track) {
          normalizedData = normalizedData.tracks.track
        } else if (normalizedData.artists?.artist) {
          normalizedData = normalizedData.artists.artist
        } else if (normalizedData.albums?.album) {
          normalizedData = normalizedData.albums.album
        } else if (normalizedData.tags?.tag) {
          normalizedData = normalizedData.tags.tag
        } else if (normalizedData.artists && Array.isArray(normalizedData.artists)) {
          // Handle case where we have { artists: [...] } directly (from chart.gettopartists)
          normalizedData = normalizedData.artists
        }
      }

      setData(normalizedData)
      logger.debug("WidgetWithData", "Data fetched successfully:", normalizedData)
      logger.debug("WidgetWithData", "Data type:", Array.isArray(normalizedData) ? 'array' : typeof normalizedData)
      if (Array.isArray(normalizedData) && normalizedData.length > 0) {
        logger.debug("WidgetWithData", "First item structure:", normalizedData[0])
      }
    } catch (err: any) {
      logger.error("WidgetWithData", "Error fetching data:", err)
      setError(err.message || "Failed to load data")
      // Fallback to static data if available
      setData(dataSource.config.data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    if (hasSourceId) {
      fetchData()
    }
  }

  // Render logic - no early returns to avoid React Hooks issues
  let content

  if (loading) {
    content = (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="text-center space-y-3 max-w-md">
          <AlertCircle className="h-10 w-10 text-orange-500 mx-auto" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Failed to load data</p>
            <p className="text-xs text-gray-600">{error}</p>
          </div>
          {hasSourceId && (
            <Button size="sm" variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  } else {
    content = (
      <WidgetRenderer
        componentCode={componentCode}
        data={data}
        theme={theme}
        title={title}
        className={className}
        widgetIndex={widgetIndex}
      />
    )
  }

  return content
}
