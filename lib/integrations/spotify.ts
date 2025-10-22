/**
 * Spotify Integration Definition
 * Pre-built integration with OAuth2 and ready-to-use API templates
 */

export interface SpotifyEndpoint {
  id: string
  name: string
  description: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  requiredScopes: string[]
  category: "user" | "tracks" | "artists" | "playlists" | "player"
  params?: {
    name: string
    type: "query" | "path"
    required: boolean
    description: string
    default?: any
  }[]
}

export const SPOTIFY_BASE_URL = "https://api.spotify.com/v1"

export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-follow-read",
]

export const SPOTIFY_ENDPOINTS: SpotifyEndpoint[] = [
  // ===== USER PROFILE =====
  {
    id: "user_profile",
    name: "Get Current User Profile",
    description: "Get detailed profile information about the current user",
    method: "GET",
    path: "/me",
    requiredScopes: ["user-read-private", "user-read-email"],
    category: "user",
  },

  // ===== TOP ITEMS =====
  {
    id: "user_top_tracks",
    name: "Get User's Top Tracks",
    description: "Get the current user's top tracks based on calculated affinity",
    method: "GET",
    path: "/me/top/tracks",
    requiredScopes: ["user-top-read"],
    category: "tracks",
    params: [
      {
        name: "time_range",
        type: "query",
        required: false,
        description: "Time period: short_term (4 weeks), medium_term (6 months), long_term (years)",
        default: "medium_term",
      },
      {
        name: "limit",
        type: "query",
        required: false,
        description: "Number of items to return (1-50)",
        default: 20,
      },
      {
        name: "offset",
        type: "query",
        required: false,
        description: "Index of the first item to return",
        default: 0,
      },
    ],
  },
  {
    id: "user_top_artists",
    name: "Get User's Top Artists",
    description: "Get the current user's top artists based on calculated affinity",
    method: "GET",
    path: "/me/top/artists",
    requiredScopes: ["user-top-read"],
    category: "artists",
    params: [
      {
        name: "time_range",
        type: "query",
        required: false,
        description: "Time period: short_term, medium_term, long_term",
        default: "medium_term",
      },
      {
        name: "limit",
        type: "query",
        required: false,
        description: "Number of items to return (1-50)",
        default: 20,
      },
    ],
  },

  // ===== RECENTLY PLAYED =====
  {
    id: "recently_played",
    name: "Get Recently Played Tracks",
    description: "Get tracks from the current user's recently played tracks",
    method: "GET",
    path: "/me/player/recently-played",
    requiredScopes: ["user-read-recently-played"],
    category: "tracks",
    params: [
      {
        name: "limit",
        type: "query",
        required: false,
        description: "Number of items to return (1-50)",
        default: 20,
      },
    ],
  },

  // ===== CURRENT PLAYBACK =====
  {
    id: "current_playback",
    name: "Get Current Playback",
    description: "Get information about the user's current playback state",
    method: "GET",
    path: "/me/player",
    requiredScopes: ["user-read-playback-state"],
    category: "player",
  },
  {
    id: "currently_playing",
    name: "Get Currently Playing Track",
    description: "Get the object currently being played on the user's Spotify account",
    method: "GET",
    path: "/me/player/currently-playing",
    requiredScopes: ["user-read-playback-state"],
    category: "player",
  },

  // ===== PLAYLISTS =====
  {
    id: "user_playlists",
    name: "Get User's Playlists",
    description: "Get a list of the playlists owned or followed by the current user",
    method: "GET",
    path: "/me/playlists",
    requiredScopes: ["playlist-read-private", "playlist-read-collaborative"],
    category: "playlists",
    params: [
      {
        name: "limit",
        type: "query",
        required: false,
        description: "Number of items to return (1-50)",
        default: 20,
      },
    ],
  },
  {
    id: "playlist_tracks",
    name: "Get Playlist Tracks",
    description: "Get full details of the tracks of a playlist",
    method: "GET",
    path: "/playlists/{playlist_id}/tracks",
    requiredScopes: ["playlist-read-private"],
    category: "playlists",
    params: [
      {
        name: "playlist_id",
        type: "path",
        required: true,
        description: "The Spotify ID of the playlist",
      },
    ],
  },

  // ===== SAVED TRACKS =====
  {
    id: "saved_tracks",
    name: "Get User's Saved Tracks",
    description: "Get a list of the songs saved in the current user's library",
    method: "GET",
    path: "/me/tracks",
    requiredScopes: ["user-library-read"],
    category: "tracks",
    params: [
      {
        name: "limit",
        type: "query",
        required: false,
        description: "Number of items to return (1-50)",
        default: 20,
      },
    ],
  },

  // ===== FOLLOWED ARTISTS =====
  {
    id: "followed_artists",
    name: "Get User's Followed Artists",
    description: "Get the current user's followed artists",
    method: "GET",
    path: "/me/following",
    requiredScopes: ["user-follow-read"],
    category: "artists",
    params: [
      {
        name: "type",
        type: "query",
        required: true,
        description: "Must be 'artist'",
        default: "artist",
      },
    ],
  },

  // ===== TRACK DETAILS =====
  {
    id: "track_audio_features",
    name: "Get Track Audio Features",
    description: "Get audio feature information for a single track",
    method: "GET",
    path: "/audio-features/{track_id}",
    requiredScopes: [],
    category: "tracks",
    params: [
      {
        name: "track_id",
        type: "path",
        required: true,
        description: "The Spotify ID for the track",
      },
    ],
  },
  {
    id: "tracks_audio_features",
    name: "Get Multiple Tracks Audio Features",
    description: "Get audio features for multiple tracks",
    method: "GET",
    path: "/audio-features",
    requiredScopes: [],
    category: "tracks",
    params: [
      {
        name: "ids",
        type: "query",
        required: true,
        description: "Comma-separated list of Spotify track IDs (max 100)",
      },
    ],
  },
]

/**
 * Integration metadata
 */
export const SPOTIFY_INTEGRATION = {
  id: "spotify",
  name: "Spotify",
  provider: "spotify",
  description: "Connect your Spotify account to access listening history, playlists, and music data",
  icon: "music",
  color: "#1DB954", // Spotify green
  authType: "oauth2" as const,
  baseUrl: SPOTIFY_BASE_URL,
  scopes: SPOTIFY_SCOPES,
  endpoints: SPOTIFY_ENDPOINTS,
  categories: [
    { id: "user", name: "User Profile", icon: "user" },
    { id: "tracks", name: "Tracks", icon: "music" },
    { id: "artists", name: "Artists", icon: "users" },
    { id: "playlists", name: "Playlists", icon: "list" },
    { id: "player", name: "Player", icon: "play" },
  ],
}

/**
 * Generate data source config for a Spotify endpoint
 */
export function generateSpotifyDataSourceConfig(endpoint: SpotifyEndpoint) {
  return {
    name: endpoint.name,
    type: "api",
    provider: "spotify",
    config: {
      baseUrl: SPOTIFY_BASE_URL,
      endpoint: endpoint.path,
      method: endpoint.method,
      auth: {
        type: "oauth2",
        provider: "spotify",
        scopes: endpoint.requiredScopes,
      },
      params: endpoint.params || [],
    },
  }
}
