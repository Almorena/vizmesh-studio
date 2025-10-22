-- ============================================================================
-- OAuth Connections Table
-- ============================================================================
-- This migration creates the oauth_connections table to store OAuth tokens
-- for third-party integrations like Spotify, GitHub, etc.

-- OAuth Connections Table
CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('spotify', 'github', 'google', 'microsoft')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT oauth_connections_user_provider_unique UNIQUE (user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS oauth_connections_user_id_idx ON oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS oauth_connections_provider_idx ON oauth_connections(provider);
CREATE INDEX IF NOT EXISTS oauth_connections_status_idx ON oauth_connections(status);

-- Updated at trigger
CREATE TRIGGER oauth_connections_updated_at
  BEFORE UPDATE ON oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own OAuth connections
CREATE POLICY "Users can view their own OAuth connections"
  ON oauth_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own OAuth connections
CREATE POLICY "Users can insert their own OAuth connections"
  ON oauth_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own OAuth connections
CREATE POLICY "Users can update their own OAuth connections"
  ON oauth_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own OAuth connections
CREATE POLICY "Users can delete their own OAuth connections"
  ON oauth_connections FOR DELETE
  USING (auth.uid() = user_id);
