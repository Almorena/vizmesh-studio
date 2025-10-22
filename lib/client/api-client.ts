/**
 * Wrapper around fetch that automatically includes the active client_id header
 * All API calls should use this instead of direct fetch
 */

export interface FetchWithClientOptions extends RequestInit {
  clientId?: string
}

/**
 * Fetch wrapper that adds x-client-id header
 *
 * @param url - The URL to fetch
 * @param options - Fetch options plus optional clientId override
 * @returns Promise with Response
 */
export async function fetchWithClient(
  url: string,
  options: FetchWithClientOptions = {}
): Promise<Response> {
  const { clientId, headers = {}, ...restOptions } = options

  // If no clientId provided, try to get from localStorage
  let activeClientId = clientId
  if (!activeClientId && typeof window !== "undefined") {
    const savedClientId = localStorage.getItem("activeClientId")
    if (savedClientId) {
      activeClientId = savedClientId
    }
  }

  // Build headers with client_id
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Convert headers to plain object if needed
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        finalHeaders[key] = value
      })
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        finalHeaders[key] = value
      })
    } else if (typeof headers === "object") {
      Object.assign(finalHeaders, headers)
    }
  }

  if (activeClientId) {
    finalHeaders["x-client-id"] = activeClientId
  }

  return fetch(url, {
    ...restOptions,
    headers: finalHeaders,
  })
}

/**
 * Helper to make GET requests with client_id
 */
export async function getWithClient(url: string, clientId?: string) {
  return fetchWithClient(url, { method: "GET", clientId })
}

/**
 * Helper to make POST requests with client_id
 */
export async function postWithClient(url: string, body: any, clientId?: string) {
  return fetchWithClient(url, {
    method: "POST",
    body: JSON.stringify(body),
    clientId,
  })
}

/**
 * Helper to make PATCH requests with client_id
 */
export async function patchWithClient(url: string, body: any, clientId?: string) {
  return fetchWithClient(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    clientId,
  })
}

/**
 * Helper to make DELETE requests with client_id
 */
export async function deleteWithClient(url: string, clientId?: string) {
  return fetchWithClient(url, { method: "DELETE", clientId })
}
