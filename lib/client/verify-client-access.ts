import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Verifies that a user has access to a specific client
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @param clientId - Client ID to verify access to
 * @returns true if user has access, false otherwise
 */
export async function verifyClientAccess(
  supabase: SupabaseClient,
  userId: string,
  clientId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("client_users")
    .select("id")
    .eq("client_id", clientId)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * Verifies that a user has a specific role (or higher) for a client
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @param clientId - Client ID to verify access to
 * @param requiredRole - Minimum required role (member, admin, owner)
 * @returns true if user has required role or higher, false otherwise
 */
export async function verifyClientRole(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
  requiredRole: "member" | "admin" | "owner"
): Promise<boolean> {
  const { data, error } = await supabase
    .from("client_users")
    .select("role")
    .eq("client_id", clientId)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return false
  }

  const roleHierarchy = { member: 0, admin: 1, owner: 2 }
  const userRoleLevel = roleHierarchy[data.role as keyof typeof roleHierarchy] || -1
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}

/**
 * Gets the client_id from request headers or query params
 * The client_id should be sent by the frontend in the x-client-id header
 *
 * @param request - Next.js request object
 * @returns client_id string or null if not found
 */
export function getClientIdFromRequest(request: Request): string | null {
  // Try to get from header first (preferred method)
  const headerClientId = request.headers.get("x-client-id")
  if (headerClientId) {
    return headerClientId
  }

  // Fallback to query param
  const url = new URL(request.url)
  const queryClientId = url.searchParams.get("client_id")
  if (queryClientId) {
    return queryClientId
  }

  return null
}
