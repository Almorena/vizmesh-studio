"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useClient } from "@/lib/client/client-context"
import { getWithClient, postWithClient, patchWithClient, deleteWithClient } from "@/lib/client/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Music, Database, Workflow, Pencil, Cloud, Rss, Github, Globe, Newspaper, Radio, Sparkles } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { SpotifyIntegrationCard } from "@/components/integrations/spotify-integration-card"
import { generateSpotifyDataSourceConfig } from "@/lib/integrations/spotify"
import Link from "next/link"

interface FormFields {
  provider: string
  clientId: string
  clientSecret: string
  apiKey: string
  baseUrl: string
  username: string
  password: string
  token: string
  scopes: string
}

interface NewSource {
  name: string
  type: string
  config: Record<string, any>
  authType: string
  description: string
}

interface DataSource {
  id: string
  name: string
  type: string
  config: any
  created_at: string
}

const SOURCE_TYPES = [
  { value: "api", label: "API", icon: Music, description: "REST API, GraphQL, etc." },
  { value: "agent", label: "Agent Graph", icon: Workflow, description: "LangGraph agents" },
  { value: "database", label: "Database", icon: Database, description: "PostgreSQL, MySQL, etc." },
  { value: "custom", label: "Custom", icon: Workflow, description: "Other data sources" },
]

export default function IntegrationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activeClient, loading: clientLoading } = useClient()
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSource, setEditingSource] = useState<DataSource | null>(null)

  const [newSource, setNewSource] = useState<NewSource>({
    name: "",
    type: "api",
    config: {},
    authType: "apikey",
    description: ""
  })
  const [configJson, setConfigJson] = useState("{}")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Form fields for different auth types
  const [formFields, setFormFields] = useState<FormFields>({
    provider: "",
    clientId: "",
    clientSecret: "",
    apiKey: "",
    baseUrl: "",
    username: "",
    password: "",
    token: "",
    scopes: "user-top-read,user-read-recently-played"
  })
  const [useAI, setUseAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [generatingAI, setGeneratingAI] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && activeClient) loadSources()
  }, [user, activeClient])

  const loadSources = async () => {
    if (!activeClient) return

    try {
      setLoading(true)
      const response = await getWithClient("/api/data-sources", activeClient.id)
      if (response.ok) {
        const data = await response.json()
        setSources(data.sources || [])
      }
    } catch (error) {
      console.error("Error loading sources:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return

    try {
      setGeneratingAI(true)
      const response = await fetch("/api/ai/generate-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setNewSource({
        name: data.name,
        type: data.type,
        config: data.config,
        authType: data.authType || "apikey",
        description: data.description || ""
      })
      setConfigJson(JSON.stringify(data.config, null, 2))
      setUseAI(false)
      setShowAdvanced(true) // Show advanced section to review AI-generated config
    } catch (error) {
      console.error("Error generating integration:", error)
      alert("Failed to generate integration")
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleCreate = async () => {
    if (!newSource.name.trim()) return

    try {
      let config: any = {}

      // If advanced mode is enabled, use JSON
      if (showAdvanced) {
        try {
          config = JSON.parse(configJson)
        } catch (e) {
          alert("Invalid JSON configuration. Please check your syntax.")
          return
        }
      } else {
        // Build config from form fields based on auth type
        if (formFields.provider) {
          config.provider = formFields.provider
        }

        // Add baseUrl if provided
        if (formFields.baseUrl) {
          config.baseUrl = formFields.baseUrl
        }

        // Add auth-specific fields
        if (newSource.authType === "oauth") {
          if (!formFields.clientId || !formFields.clientSecret) {
            alert("Client ID and Client Secret are required for OAuth")
            return
          }
          config.clientId = formFields.clientId
          config.clientSecret = formFields.clientSecret

          // Add scopes if provided
          if (formFields.scopes) {
            config.scopes = formFields.scopes.split(",").map(s => s.trim())
          }
        } else if (newSource.authType === "apikey") {
          if (!formFields.apiKey) {
            alert("API Key is required")
            return
          }
          config.apiKey = formFields.apiKey
        } else if (newSource.authType === "basic") {
          if (!formFields.username || !formFields.password) {
            alert("Username and Password are required for Basic Auth")
            return
          }
          config.username = formFields.username
          config.password = formFields.password
        } else if (newSource.authType === "jwt") {
          if (!formFields.token) {
            alert("Token is required for JWT")
            return
          }
          config.token = formFields.token
        }
      }

      // Validate that we have meaningful config (not just provider/baseUrl)
      const hasAuthConfig = config.clientId || config.clientSecret || config.apiKey || config.username || config.token
      if (!showAdvanced && !hasAuthConfig) {
        alert("Please fill in the required authentication fields")
        return
      }

      if (!activeClient) {
        alert("No active client selected")
        return
      }

      setSaving(true)
      const response = await postWithClient(
        "/api/data-sources",
        { ...newSource, config },
        activeClient.id
      )

      if (!response.ok) throw new Error("Failed to create source")

      await loadSources()
      setModalOpen(false)
      setNewSource({ name: "", type: "api", config: {}, authType: "apikey", description: "" })
      setFormFields({
        provider: "",
        clientId: "",
        clientSecret: "",
        apiKey: "",
        baseUrl: "",
        username: "",
        password: "",
        token: "",
        scopes: "user-top-read,user-read-recently-played"
      })
      setConfigJson("{}")
      setUseAI(false)
      setAiPrompt("")
      setShowAdvanced(false)
    } catch (error) {
      console.error("Error creating source:", error)
      alert("Failed to create integration. Check your configuration.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this integration?")) return
    if (!activeClient) {
      alert("No active client selected")
      return
    }

    try {
      const response = await deleteWithClient(`/api/data-sources?id=${id}`, activeClient.id)
      if (!response.ok) throw new Error("Failed to delete")
      await loadSources()
    } catch (error) {
      console.error("Error deleting source:", error)
      alert("Failed to delete integration")
    }
  }

  const handleEdit = (source: DataSource) => {
    setEditingSource(source)
    setNewSource({
      name: source.name,
      type: source.type,
      config: source.config,
      authType: source.config.clientId ? "oauth" : source.config.apiKey ? "apikey" : source.config.username ? "basic" : source.config.token ? "jwt" : "apikey",
      description: ""
    })
    setFormFields({
      provider: source.config.provider || "",
      clientId: source.config.clientId || "",
      clientSecret: source.config.clientSecret || "",
      apiKey: source.config.apiKey || "",
      baseUrl: source.config.baseUrl || "",
      username: source.config.username || "",
      password: source.config.password || "",
      token: source.config.token || "",
      scopes: source.config.scopes ? source.config.scopes.join(",") : ""
    })
    setConfigJson(JSON.stringify(source.config, null, 2))
    setShowAdvanced(false)
    setModalOpen(true)
  }

  const handleUpdate = async () => {
    try {
      if (!editingSource) return
      if (!activeClient) {
        alert("No active client selected")
        return
      }

      let config = { ...newSource.config }

      if (showAdvanced) {
        try {
          config = JSON.parse(configJson)
        } catch (e) {
          alert("Invalid JSON in configuration")
          return
        }
      } else {
        if (formFields.provider) config.provider = formFields.provider
        if (formFields.baseUrl) config.baseUrl = formFields.baseUrl

        if (newSource.authType === "oauth") {
          if (!formFields.clientId || !formFields.clientSecret) {
            alert("Client ID and Client Secret are required for OAuth")
            return
          }
          config.clientId = formFields.clientId
          config.clientSecret = formFields.clientSecret
          if (formFields.scopes) {
            config.scopes = formFields.scopes.split(",").map(s => s.trim())
          }
        } else if (newSource.authType === "apikey") {
          if (!formFields.apiKey) {
            alert("API Key is required")
            return
          }
          config.apiKey = formFields.apiKey
        } else if (newSource.authType === "basic") {
          if (!formFields.username || !formFields.password) {
            alert("Username and Password are required for Basic Auth")
            return
          }
          config.username = formFields.username
          config.password = formFields.password
        } else if (newSource.authType === "jwt") {
          if (!formFields.token) {
            alert("Token is required for JWT")
            return
          }
          config.token = formFields.token
        }
      }

      setSaving(true)
      const response = await patchWithClient(
        `/api/data-sources?id=${editingSource.id}`,
        { ...newSource, config },
        activeClient.id
      )

      if (!response.ok) throw new Error("Failed to update source")

      await loadSources()
      setModalOpen(false)
      setEditingSource(null)
      setNewSource({ name: "", type: "api", config: {}, authType: "apikey", description: "" })
      setFormFields({
        provider: "",
        clientId: "",
        clientSecret: "",
        apiKey: "",
        baseUrl: "",
        username: "",
        password: "",
        token: "",
        scopes: "user-top-read,user-read-recently-played"
      })
      setConfigJson("{}")
      setShowAdvanced(false)
    } catch (error) {
      console.error("Error updating source:", error)
      alert("Failed to update integration. Check your configuration.")
    } finally {
      setSaving(false)
    }
  }

  const handleOAuthConnect = (source: DataSource) => {
    const provider = source.config.provider?.toLowerCase()

    if (provider === "spotify") {
      const { clientId, scopes = ["user-top-read", "user-read-recently-played"] } = source.config

      if (!clientId) {
        alert("Spotify Client ID is required in the integration config")
        return
      }

      const state = Buffer.from(JSON.stringify({ provider: "spotify", sourceId: source.id })).toString("base64")
      const redirectUri = `${window.location.origin}/api/oauth/callback`

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes.join(" "))}&` +
        `state=${state}`

      window.location.href = authUrl
    } else if (provider === "github") {
      const { clientId, scopes = ["repo", "user"] } = source.config

      if (!clientId) {
        alert("GitHub Client ID is required in the integration config")
        return
      }

      const state = Buffer.from(JSON.stringify({ provider: "github", sourceId: source.id })).toString("base64")
      const redirectUri = `${window.location.origin}/api/oauth/callback`

      const authUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes.join(" "))}&` +
        `state=${state}`

      window.location.href = authUrl
    } else {
      alert(`OAuth not yet implemented for ${provider}`)
    }
  }

  const needsOAuth = (source: DataSource) => {
    const provider = source.config.provider?.toLowerCase()
    return (provider === "spotify" || provider === "github") && !source.config.accessToken
  }

  if (authLoading || !user || clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </div>
    )
  }

  if (!activeClient) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container-app py-24 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No client selected or no clients available</p>
            <p className="text-sm text-muted-foreground">Please contact your administrator to get access to a client</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero Section - Minimal */}
      <section className="border-b">
        <div className="container-app py-16">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-5xl font-light tracking-tight mb-4">Integrations</h1>
            <p className="text-lg text-muted-foreground font-light mb-8">
              Connect your data sources
            </p>
            <Button onClick={() => setModalOpen(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Integration
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container-app py-12">
        <div className="max-w-6xl mx-auto">
          {/* Pre-built Integrations */}
          <div className="mb-12 animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-light tracking-tight mb-2">Pre-built Integrations</h2>
              <p className="text-muted-foreground font-light">
                1-click integrations with popular services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SpotifyIntegrationCard
                onAddEndpoint={(endpoint) => {
                  // Generate data source config from endpoint
                  const config = generateSpotifyDataSourceConfig(endpoint)
                  // Open modal with pre-filled config
                  setNewSource({
                    name: config.name,
                    type: config.type,
                    config: config.config,
                    authType: "oauth2",
                    description: endpoint.description
                  })
                  setConfigJson(JSON.stringify(config.config, null, 2))
                  setModalOpen(true)
                }}
              />
            </div>
          </div>

          {/* Custom Integrations */}
          <div className="mb-6">
            <h2 className="text-2xl font-light tracking-tight mb-2">Your Integrations</h2>
            <p className="text-muted-foreground font-light">
              Custom data sources you've configured
            </p>
          </div>

          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-12 w-12 rounded-xl" />
                        <div className="space-y-2">
                          <div className="skeleton h-5 w-32" />
                          <div className="skeleton h-4 w-20" />
                        </div>
                      </div>
                    </div>
                    <div className="skeleton h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : sources.length === 0 ? (
            /* Empty State */
            <div className="empty-state animate-scale-in">
              <div className="empty-state-icon">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="empty-state-title">No integrations yet</h3>
                <p className="empty-state-description">
                  Add data sources to power your widgets with real-time data from APIs, databases, and more
                </p>
              </div>
              <Button onClick={() => setModalOpen(true)} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Integration
              </Button>
            </div>
          ) : (
            /* Integration Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
              {sources.map((source) => {
                const SourceType = SOURCE_TYPES.find(t => t.value === source.type)

                // Get icon based on provider first, then fall back to type
                const getIcon = () => {
                  const provider = source.config.provider?.toLowerCase()
                  if (provider === 'spotify') return Music
                  if (provider === 'lastfm' || provider === 'last.fm') return Radio
                  if (provider === 'github') return Github
                  if (provider === 'perplexity') return Sparkles
                  if (provider === 'openweathermap' || provider === 'weather') return Cloud
                  if (provider === 'newsapi') return Newspaper
                  if (provider === 'rss') return Rss
                  // Fall back to type icon
                  return SourceType?.icon || Database
                }

                const Icon = getIcon()

                return (
                  <div key={source.id} className="card-hover group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-foreground" />
                        <div>
                          <h3 className="font-semibold">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">{SourceType?.label || source.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(source)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(source.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {needsOAuth(source) ? (
                      <Button onClick={() => handleOAuthConnect(source)} className="w-full mb-3" variant="outline">
                        Connect with {source.config.provider}
                      </Button>
                    ) : (
                      <div className="mb-3">
                        <span className="badge badge-success">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Connected
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>Added {new Date(source.created_at).toLocaleDateString()}</span>
                      {source.config.provider && (
                        <span className="badge badge-primary capitalize">
                          {source.config.provider}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal for Add/Edit Integration */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open)
        if (!open) {
          setEditingSource(null)
          setNewSource({ name: "", type: "api", config: {}, authType: "apikey", description: "" })
          setFormFields({
            provider: "",
            clientId: "",
            clientSecret: "",
            apiKey: "",
            baseUrl: "",
            username: "",
            password: "",
            token: "",
            scopes: "user-top-read,user-read-recently-played"
          })
          setConfigJson("{}")
          setShowAdvanced(false)
          setUseAI(false)
          setAiPrompt("")
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSource ? "Edit Integration" : "Add Integration"}</DialogTitle>
            <DialogDescription>{editingSource ? "Update your integration configuration" : "Connect a data source or API"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[calc(90vh-200px)] overflow-y-auto pr-2">
            {/* AI Assistant Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="rounded border-border focus:ring-2 focus:ring-primary/20"
                />
                <label className="text-sm font-medium">Use AI Assistant</label>
              </div>
              <span className="text-xs text-muted-foreground">Let AI configure for you</span>
            </div>

            {useAI ? (
              <>
                <div className="input-group">
                  <label className="input-label">Describe the integration</label>
                  <textarea
                    className="input min-h-[100px] resize-none"
                    placeholder="e.g., I want to connect to Spotify API to get my top tracks"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={generatingAI}
                  />
                </div>
                <Button onClick={handleGenerateWithAI} disabled={generatingAI || !aiPrompt.trim()} className="w-full gap-2">
                  {generatingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate with AI"
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Basic Info */}
                <div className="input-group">
                  <label className="input-label">Name *</label>
                  <Input
                    placeholder="My Integration"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    disabled={saving}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description (optional)</label>
                  <Input
                    placeholder="What this integration does"
                    value={newSource.description}
                    onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                    disabled={saving}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Type</label>
                    <select
                      className="input"
                      value={newSource.type}
                      onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                      disabled={saving}
                    >
                      {SOURCE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Auth Type</label>
                    <select
                      className="input"
                      value={newSource.authType}
                      onChange={(e) => setNewSource({ ...newSource, authType: e.target.value })}
                      disabled={saving}
                    >
                      <option value="apikey">API Key</option>
                      <option value="oauth">OAuth 2.0</option>
                      <option value="basic">Basic Auth</option>
                      <option value="jwt">JWT Token</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="input-group">
                  <label className="input-label">
                    Provider (optional)
                  </label>
                  <Input
                    placeholder="e.g., spotify, github, lastfm"
                    value={formFields.provider}
                    onChange={(e) => setFormFields({ ...formFields, provider: e.target.value.toLowerCase() })}
                    disabled={saving}
                    className="input"
                  />
                  {formFields.provider && (
                    <p className="input-hint">
                      {formFields.provider === "lastfm" && "Base URL: https://ws.audioscrobbler.com/2.0"}
                      {formFields.provider === "spotify" && "Base URL: https://api.spotify.com/v1 | Requires OAuth"}
                      {formFields.provider === "github" && "Base URL: https://api.github.com | Supports OAuth or API Key"}
                      {formFields.provider === "openweathermap" && "Base URL: https://api.openweathermap.org/data/2.5"}
                      {formFields.provider === "newsapi" && "Base URL: https://newsapi.org/v2"}
                    </p>
                  )}
                </div>

                {/* Base URL */}
                <div className="input-group">
                  <label className="input-label">Base URL</label>
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={formFields.baseUrl}
                    onChange={(e) => setFormFields({ ...formFields, baseUrl: e.target.value })}
                    disabled={saving}
                    className="input"
                  />
                  <p className="input-hint">API endpoint base URL</p>
                </div>

                {/* OAuth Fields */}
                {newSource.authType === "oauth" && (
                  <>
                    {/* Redirect URI Helper */}
                    <div className="p-4 bg-muted border border-border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-foreground mt-0.5">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">OAuth Redirect URI Setup</p>
                          <p className="text-xs text-muted-foreground">
                            Most OAuth providers require HTTPS. For development, deploy to Vercel or use a local HTTPS proxy.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-xs font-mono">
                              {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3003'}/api/oauth/callback
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                const uri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3003'}/api/oauth/callback`
                                navigator.clipboard.writeText(uri)
                                alert('Redirect URI copied!')
                              }}
                              className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary-dark whitespace-nowrap transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="input-group">
                        <label className="input-label">Client ID *</label>
                        <Input
                          placeholder="Your OAuth Client ID"
                          value={formFields.clientId}
                          onChange={(e) => setFormFields({ ...formFields, clientId: e.target.value })}
                          disabled={saving}
                          required
                          className="input"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Client Secret *</label>
                        <Input
                          type="password"
                          placeholder="Your OAuth Client Secret"
                          value={formFields.clientSecret}
                          onChange={(e) => setFormFields({ ...formFields, clientSecret: e.target.value })}
                          disabled={saving}
                          required
                          className="input"
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Scopes</label>
                      <Input
                        placeholder="user-top-read,user-read-recently-played"
                        value={formFields.scopes}
                        onChange={(e) => setFormFields({ ...formFields, scopes: e.target.value })}
                        disabled={saving}
                        className="input"
                      />
                      <p className="input-hint">Comma-separated list of OAuth scopes</p>
                    </div>
                  </>
                )}

                {/* API Key Fields */}
                {newSource.authType === "apikey" && (
                  <div className="input-group">
                    <label className="input-label">API Key *</label>
                    <Input
                      type="password"
                      placeholder="Your API Key"
                      value={formFields.apiKey}
                      onChange={(e) => setFormFields({ ...formFields, apiKey: e.target.value })}
                      disabled={saving}
                      required
                      className="input"
                    />
                  </div>
                )}

                {/* Basic Auth Fields */}
                {newSource.authType === "basic" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">Username *</label>
                      <Input
                        placeholder="Username"
                        value={formFields.username}
                        onChange={(e) => setFormFields({ ...formFields, username: e.target.value })}
                        disabled={saving}
                        required
                        className="input"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Password *</label>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={formFields.password}
                        onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                        disabled={saving}
                        required
                        className="input"
                      />
                    </div>
                  </div>
                )}

                {/* JWT Token Field */}
                {newSource.authType === "jwt" && (
                  <div className="input-group">
                    <label className="input-label">JWT Token *</label>
                    <Input
                      type="password"
                      placeholder="Your JWT Token"
                      value={formFields.token}
                      onChange={(e) => setFormFields({ ...formFields, token: e.target.value })}
                      disabled={saving}
                      required
                      className="input"
                    />
                  </div>
                )}

                {/* Advanced Configuration Toggle */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    {showAdvanced ? "Hide" : "Show"} Advanced JSON Configuration
                  </button>
                  <p className="input-hint mt-1">
                    For advanced users: edit the raw JSON configuration
                  </p>
                </div>

                {showAdvanced && (
                  <div className="input-group">
                    <label className="input-label">Configuration (JSON)</label>
                    <textarea
                      className="input min-h-[200px] font-mono text-sm resize-none"
                      placeholder='{"apiKey": "...", "baseUrl": "..."}'
                      value={configJson}
                      onChange={(e) => setConfigJson(e.target.value)}
                      disabled={saving}
                    />
                    <p className="input-hint">
                      Enter configuration as JSON. For OAuth: include clientId, clientSecret, scopes.
                      For API Key: include apiKey, baseUrl.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={editingSource ? handleUpdate : handleCreate} disabled={saving || !newSource.name.trim()} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {editingSource ? "Update Integration" : "Add Integration"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
