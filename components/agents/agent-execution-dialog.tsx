"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface AgentExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: {
    id: string
    name: string
    description: string
  }
}

export function AgentExecutionDialog({ open, onOpenChange, agent }: AgentExecutionDialogProps) {
  const [executing, setExecuting] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleExecute = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt")
      return
    }

    try {
      setExecuting(true)
      setResult(null)

      const response = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          userPrompt: prompt,
          context: {},
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data.execution)
      } else {
        const error = await response.json()
        setResult({ status: "failed", error: error.error })
      }
    } catch (error: any) {
      console.error("Failed to execute agent:", error)
      setResult({ status: "failed", error: error.message })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execute Agent: {agent.name}</DialogTitle>
          <DialogDescription>{agent.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Your Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="What would you like the agent to analyze?"
              className="min-h-[100px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={executing}
            />
          </div>

          {executing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Agent is working... This may take 10-30 seconds</span>
            </div>
          )}

          {result && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center gap-2">
                {result.status === "completed" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {result.status === "completed" ? "Execution Completed" : "Execution Failed"}
                </span>
              </div>

              {result.status === "completed" && result.outcome && (
                <div className="space-y-2">
                  <Label>Result</Label>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(result.outcome, null, 2)}
                  </pre>
                </div>
              )}

              {result.error && (
                <div className="text-sm text-red-500">
                  Error: {result.error}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Steps:</span>{" "}
                  <span className="font-semibold">{result.steps?.length || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tokens:</span>{" "}
                  <span className="font-semibold">{result.total_tokens || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-semibold">${(result.total_cost || 0).toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleExecute} disabled={executing || !prompt.trim()}>
            {executing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Execute Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
