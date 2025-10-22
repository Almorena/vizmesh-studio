"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { formatDistance } from "date-fns"

interface Execution {
  id: string
  agent_id: string
  user_prompt: string
  status: "running" | "completed" | "failed" | "cancelled"
  steps: any[]
  total_tokens: number
  total_cost: number
  duration_ms: number
  started_at: string
  completed_at: string
}

export function AgentExecutionsHistory() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExecutions()
  }, [])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      // For now, show empty state
      // TODO: Create /api/agents/executions endpoint
      setExecutions([])
    } catch (error) {
      console.error("Failed to load executions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
          <p className="text-sm text-muted-foreground">
            Execute an agent to see the history here
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {executions.map((execution) => (
        <Card key={execution.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg line-clamp-1">
                  {execution.user_prompt}
                </CardTitle>
                <CardDescription>
                  {formatDistance(new Date(execution.started_at), new Date(), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                <Badge variant={execution.status === "completed" ? "default" : "secondary"}>
                  {execution.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Steps:</span>{" "}
                <span className="font-semibold">{execution.steps.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tokens:</span>{" "}
                <span className="font-semibold">{execution.total_tokens}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cost:</span>{" "}
                <span className="font-semibold">${execution.total_cost.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>{" "}
                <span className="font-semibold">{(execution.duration_ms / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
