"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, Check, ExternalLink, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SPOTIFY_INTEGRATION, SPOTIFY_ENDPOINTS, type SpotifyEndpoint } from "@/lib/integrations/spotify"

interface SpotifyIntegrationCardProps {
  onConnect?: () => void
  onAddEndpoint?: (endpoint: SpotifyEndpoint) => void
}

export function SpotifyIntegrationCard({ onConnect, onAddEndpoint }: SpotifyIntegrationCardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [showEndpoints, setShowEndpoints] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // Check if user has an active Spotify OAuth connection
      const response = await fetch("/api/oauth/check?provider=spotify")
      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.connected)
      }
    } catch (error) {
      console.error("Error checking Spotify connection:", error)
    }
  }

  const handleConnect = async () => {
    // Redirect to Spotify OAuth flow
    window.location.href = "/api/oauth/connect?provider=spotify"
  }

  const filteredEndpoints = selectedCategory
    ? SPOTIFY_ENDPOINTS.filter((endpoint) => endpoint.category === selectedCategory)
    : SPOTIFY_ENDPOINTS

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow border-2" style={{ borderColor: SPOTIFY_INTEGRATION.color + "40" }}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: SPOTIFY_INTEGRATION.color + "20" }}
              >
                <Music className="h-6 w-6" style={{ color: SPOTIFY_INTEGRATION.color }} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {SPOTIFY_INTEGRATION.name}
                  {isConnected && <Check className="h-4 w-4 text-green-500" />}
                </CardTitle>
                <CardDescription>{SPOTIFY_INTEGRATION.description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Connected via OAuth" : "Not connected"}
              </p>
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Disconnected</Badge>
            )}
          </div>

          {/* Available Endpoints */}
          <div>
            <p className="text-sm font-medium mb-2">Available Endpoints</p>
            <p className="text-xs text-muted-foreground mb-3">{SPOTIFY_ENDPOINTS.length} pre-configured API endpoints</p>
            <div className="flex flex-wrap gap-2">
              {SPOTIFY_INTEGRATION.categories.map((category) => {
                const count = SPOTIFY_ENDPOINTS.filter((e) => e.category === category.id).length
                return (
                  <Badge key={category.id} variant="outline" className="text-xs">
                    {category.name} ({count})
                  </Badge>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isConnected ? (
              <Button onClick={handleConnect} className="flex-1" style={{ backgroundColor: SPOTIFY_INTEGRATION.color }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Spotify
              </Button>
            ) : (
              <Button onClick={() => setShowEndpoints(true)} variant="default" className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Add Endpoint
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Dialog */}
      <Dialog open={showEndpoints} onOpenChange={setShowEndpoints}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" style={{ color: SPOTIFY_INTEGRATION.color }} />
              Spotify API Endpoints
            </DialogTitle>
            <DialogDescription>
              Select an endpoint to add to your data sources. All endpoints use your connected Spotify account.
            </DialogDescription>
          </DialogHeader>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              All ({SPOTIFY_ENDPOINTS.length})
            </Button>
            {SPOTIFY_INTEGRATION.categories.map((category) => {
              const count = SPOTIFY_ENDPOINTS.filter((e) => e.category === category.id).length
              return (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({count})
                </Button>
              )
            })}
          </div>

          {/* Endpoints List */}
          <div className="grid gap-3">
            {filteredEndpoints.map((endpoint) => (
              <Card key={endpoint.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {endpoint.name}
                        <Badge variant="outline" className="text-xs">
                          {endpoint.method}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">{endpoint.description}</CardDescription>
                      <code className="text-xs text-muted-foreground mt-2 block">{endpoint.path}</code>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onAddEndpoint?.(endpoint)
                        setShowEndpoints(false)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                {endpoint.params && endpoint.params.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs">
                      <p className="font-medium mb-1">Parameters:</p>
                      <div className="flex flex-wrap gap-2">
                        {endpoint.params.map((param) => (
                          <Badge key={param.name} variant="secondary" className="text-xs">
                            {param.name}
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
