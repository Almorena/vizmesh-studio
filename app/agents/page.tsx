"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Play, History, Settings, Brain, Zap, TrendingUp } from "lucide-react"
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { AgentExecutionDialog } from "@/components/agents/agent-execution-dialog"
import { AgentExecutionsHistory } from "@/components/agents/agent-executions-history"
import { AppHeader } from "@/components/layout/app-header"

interface Agent {
  id: string
  name: string
  description: string
  system_prompt: string
  model: string
  status: "draft" | "active" | "paused" | "archived"
  available_tools: any[]
  created_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("Failed to load agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setExecuteDialogOpen(true)
  }

  // Pre-built agent templates
  const agentTemplates = [
    {
      name: "Music Trend Analyzer",
      description: "Analyzes your Spotify listening habits and finds emerging trends using Last.fm and Nextatlas",
      icon: TrendingUp,
      tools: ["Spotify", "Last.fm", "Nextatlas"],
      color: "bg-purple-500",
    },
    {
      name: "GitHub Profile Analyzer",
      description: "Reviews your GitHub profile, analyzes your repositories, and provides improvement suggestions",
      icon: Brain,
      tools: ["GitHub"],
      color: "bg-blue-500",
    },
    {
      name: "Custom Multi-Source Agent",
      description: "Create your own agent that combines data from multiple integrations",
      icon: Zap,
      tools: ["Custom"],
      color: "bg-green-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">AI Agents</h1>
            <p className="text-muted-foreground mt-2">
              Intelligent workflows that combine data from multiple sources
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Agent
          </Button>
        </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="agents">
            <Brain className="mr-2 h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Zap className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Your Agents Tab */}
        <TabsContent value="agents" className="space-y-4 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : agents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first agent to start generating intelligent insights
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl">{agent.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {agent.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={agent.status === "active" ? "default" : "secondary"}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span>{agent.available_tools.length} tools available</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExecuteAgent(agent)}
                        className="flex-1"
                        size="sm"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Execute
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentTemplates.map((template) => {
              const Icon = template.icon
              return (
                <Card
                  key={template.name}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // Pre-fill create dialog with template
                    setCreateDialogOpen(true)
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${template.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.tools.map((tool) => (
                        <Badge key={tool} variant="secondary">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <AgentExecutionsHistory />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAgentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadAgents}
      />

      {selectedAgent && (
        <AgentExecutionDialog
          open={executeDialogOpen}
          onOpenChange={setExecuteDialogOpen}
          agent={selectedAgent}
        />
      )}
      </div>
    </div>
  )
}
