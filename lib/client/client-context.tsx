"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export interface Client {
  id: string
  name: string
  slug: string
  logo_url?: string
  settings?: any
  user_role?: string
}

interface ClientContextType {
  clients: Client[]
  activeClient: Client | null
  setActiveClient: (client: Client | null) => void
  loading: boolean
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [activeClient, setActiveClientState] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  // Load user's clients from database
  const loadClients = useCallback(async () => {
    if (!user) {
      setClients([])
      setActiveClientState(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      console.log("Loading clients for user:", user.id)

      // First, try to get clients directly to test
      const { data: testData, error: testError } = await supabase
        .from("clients")
        .select("*")
        .limit(5)

      console.log("Test query - can we read clients table?", { testData, testError })

      // Now try the actual query with join
      const { data, error } = await supabase
        .from("client_users")
        .select(`
          role,
          clients (
            id,
            name,
            slug,
            logo_url,
            settings
          )
        `)
        .eq("user_id", user.id)

      console.log("Main query result:", { data, error })

      if (error) {
        console.error("Supabase error loading clients:", error)
        console.error("Error details:", JSON.stringify(error, null, 2))
        throw error
      }

      console.log("Raw client data:", data)

      // Transform data to include role
      const userClients: Client[] = data?.map((item: any) => ({
        id: item.clients.id,
        name: item.clients.name,
        slug: item.clients.slug,
        logo_url: item.clients.logo_url,
        settings: item.clients.settings,
        user_role: item.role
      })) || []

      console.log("Transformed clients:", userClients)

      setClients(userClients)

      // Set active client from localStorage or first client
      const savedClientId = localStorage.getItem("activeClientId")
      const savedClient = userClients.find(c => c.id === savedClientId)

      if (savedClient) {
        setActiveClientState(savedClient)
      } else if (userClients.length > 0) {
        setActiveClientState(userClients[0])
        localStorage.setItem("activeClientId", userClients[0].id)
      }
    } catch (error) {
      console.error("Error loading clients:", error)
      // Set empty state on error
      setClients([])
      setActiveClientState(null)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Load clients when user changes
  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Update localStorage when active client changes
  const setActiveClient = useCallback((client: Client | null) => {
    setActiveClientState(client)
    if (client) {
      localStorage.setItem("activeClientId", client.id)
    } else {
      localStorage.removeItem("activeClientId")
    }
  }, [])

  const refreshClients = useCallback(async () => {
    await loadClients()
  }, [loadClients])

  return (
    <ClientContext.Provider
      value={{
        clients,
        activeClient,
        setActiveClient,
        loading,
        refreshClients
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider")
  }
  return context
}
