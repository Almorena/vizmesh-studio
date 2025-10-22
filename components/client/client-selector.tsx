"use client"

import { useState } from "react"
import { useClient } from "@/lib/client/client-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check, Building2 } from "lucide-react"

export function ClientSelector() {
  const { clients, activeClient, setActiveClient, loading } = useClient()
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="spinner w-4 h-4" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No clients</span>
      </div>
    )
  }

  if (clients.length === 1) {
    // Single client - no need for dropdown
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{clients[0].name}</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">
            {activeClient ? activeClient.name : "Select client"}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {clients.map((client) => (
          <DropdownMenuItem
            key={client.id}
            onClick={() => {
              setActiveClient(client)
              setOpen(false)
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <div>
                <div className="font-medium">{client.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {client.user_role}
                </div>
              </div>
            </div>
            {activeClient?.id === client.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
