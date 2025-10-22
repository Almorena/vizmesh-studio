# VizMesh Studio - Integration System

## Overview

The Integration System allows users to connect external data sources (APIs, databases, agents) to VizMesh Studio and use them in widgets.

## Architecture

### 1. Generic Integration Types

Instead of hardcoded integrations (spotify, lastfm), we use flexible types:

- **API**: REST APIs, GraphQL endpoints, webhooks
- **Agent**: LangGraph agents, custom AI agents
- **Database**: PostgreSQL, MySQL, MongoDB, etc.
- **Custom**: Any other data source type

### 2. Configuration Methods

Users have two ways to configure integrations:

#### Manual Configuration (Flexible JSON)
- Enter name, select type
- Provide JSON configuration with any fields needed
- Example:
```json
{
  "provider": "spotify",
  "clientId": "YOUR_CLIENT_ID",
  "clientSecret": "YOUR_CLIENT_SECRET",
  "scopes": ["user-top-read"],
  "baseUrl": "https://api.spotify.com/v1"
}
```

#### AI Assistant (Natural Language)
- Describe what you want in plain English
- AI generates complete configuration
- Review and edit before saving
- Example: "Connect to Spotify API to get my top tracks"

### 3. Database Schema

```sql
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'api', 'agent', 'database', 'custom'
  config JSONB NOT NULL, -- Flexible JSON configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### GET /api/data-sources
Fetch all integrations for the current user.

**Response:**
```json
{
  "sources": [
    {
      "id": "uuid",
      "name": "Spotify API",
      "type": "api",
      "config": { ... },
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/data-sources
Create a new integration.

**Request:**
```json
{
  "name": "Spotify API",
  "type": "api",
  "config": {
    "provider": "spotify",
    "clientId": "...",
    "clientSecret": "...",
    "scopes": ["user-top-read"],
    "baseUrl": "https://api.spotify.com/v1"
  }
}
```

### DELETE /api/data-sources?id=uuid
Delete an integration.

### POST /api/ai/generate-integration
AI-powered integration configuration generation.

**Request:**
```json
{
  "prompt": "Connect to Spotify API to get my top tracks"
}
```

**Response:**
```json
{
  "name": "Spotify API",
  "type": "api",
  "config": {
    "provider": "spotify",
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "scopes": ["user-top-read", "user-read-recently-played"],
    "baseUrl": "https://api.spotify.com/v1"
  }
}
```

## UI Flow

### Integrations Page (`/integrations`)

1. **List View**: Shows all configured integrations with icons
2. **Add Integration Button**: Opens modal
3. **Modal Options**:
   - Toggle: "Use AI Assistant" checkbox
   - **AI Mode**:
     - Textarea for natural language description
     - "Generate with AI" button
     - AI populates name, type, and config
   - **Manual Mode**:
     - Name input
     - Type dropdown (API, Agent, Database, Custom)
     - JSON editor for configuration
4. **Save**: Validates JSON and saves to database

## Widget Integration

Widgets can reference integrations via `dataSource`:

```json
{
  "title": "My Top Tracks",
  "dataSource": {
    "type": "api",
    "config": {
      "sourceId": "uuid-of-spotify-integration",
      "endpoint": "/me/top/tracks"
    }
  },
  "visualization": { ... }
}
```

## Next Steps

### Phase 1: Data Fetching (CURRENT PRIORITY)
- [ ] Create `/api/fetch-data` endpoint
- [ ] Support different integration types (API, Agent, Database)
- [ ] Handle authentication (OAuth, API keys, etc.)
- [ ] Cache responses for performance
- [ ] Error handling and retries

### Phase 2: OAuth Flow
- [ ] Add OAuth callback handlers
- [ ] Store tokens securely in Supabase
- [ ] Refresh token logic
- [ ] Support common providers (Spotify, Google, GitHub)

### Phase 3: Real-time Updates
- [ ] WebSocket support for live data
- [ ] Polling for periodic updates
- [ ] Webhook receivers

### Phase 4: Advanced Features
- [ ] Rate limiting per integration
- [ ] Usage analytics per source
- [ ] Data transformation layer
- [ ] Integration marketplace/templates

## Security Considerations

1. **Sensitive Data**: API keys and secrets stored in encrypted JSONB
2. **Row Level Security**: Users can only access their own integrations
3. **Validation**: All JSON configs validated before saving
4. **Sandbox Execution**: Widget code runs in isolated iframe

## Examples

### Example 1: Spotify API
```json
{
  "name": "Spotify API",
  "type": "api",
  "config": {
    "provider": "spotify",
    "clientId": "abc123",
    "clientSecret": "xyz789",
    "scopes": ["user-top-read"],
    "baseUrl": "https://api.spotify.com/v1",
    "authType": "oauth2"
  }
}
```

### Example 2: PostgreSQL Database
```json
{
  "name": "Analytics DB",
  "type": "database",
  "config": {
    "type": "postgresql",
    "host": "db.example.com",
    "port": 5432,
    "database": "analytics",
    "username": "user",
    "password": "encrypted_password",
    "ssl": true
  }
}
```

### Example 3: LangGraph Agent
```json
{
  "name": "Music Recommendation Agent",
  "type": "agent",
  "config": {
    "agentId": "music-rec-v1",
    "apiUrl": "https://api.langgraph.dev/run",
    "apiKey": "lg_api_key_123"
  }
}
```

## Testing

To test the integration system:

1. Navigate to http://localhost:3003/integrations
2. Click "Add Integration"
3. Toggle "Use AI Assistant"
4. Enter: "I want to connect to Last.fm API for music listening history"
5. Click "Generate with AI"
6. Review the generated config
7. Click "Add Integration"
8. Verify it appears in the list

## Files

- `/app/integrations/page.tsx` - Main integrations UI
- `/app/api/data-sources/route.ts` - CRUD endpoints
- `/app/api/ai/generate-integration/route.ts` - AI configuration generator
- `/app/api/ai/generate-widget/route.ts` - Widget generator (uses integrations)
- `INTEGRATION_SYSTEM.md` - This documentation
