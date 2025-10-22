-- =============================================
-- Migration: Agents System
-- Description: AI agents that can execute multi-step workflows
--              combining multiple data sources and generating insights
-- =============================================

-- =============================================
-- 0. HELPER FUNCTIONS (if not already exists)
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 1. AGENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Agent metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Agent configuration
  system_prompt TEXT NOT NULL, -- Instructions for the agent
  model TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022', -- LLM model to use
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4000,

  -- Tools configuration
  available_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   { "type": "integration", "integration_id": "uuid", "name": "spotify_top_tracks" },
  --   { "type": "integration", "integration_id": "uuid", "name": "lastfm_artist_info" },
  --   { "type": "mcp", "server": "web-search", "tool": "search" },
  --   { "type": "custom", "name": "calculate", "implementation": "..." }
  -- ]

  -- Execution settings
  max_iterations INTEGER DEFAULT 10, -- Prevent infinite loops
  timeout_seconds INTEGER DEFAULT 300, -- 5 minutes default

  -- State
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT agents_name_client_unique UNIQUE (client_id, name)
);

-- Index for quick lookups
CREATE INDEX idx_agents_client_id ON agents(client_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. AGENT EXECUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE SET NULL, -- Optional: link to widget

  -- Input
  user_prompt TEXT NOT NULL, -- What the user asked for
  context JSONB DEFAULT '{}'::jsonb, -- Additional context (user data, preferences, etc.)

  -- Execution trace
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {
  --     "step": 1,
  --     "type": "tool_call",
  --     "tool": "spotify_top_tracks",
  --     "input": {...},
  --     "output": {...},
  --     "timestamp": "2025-01-22T10:30:00Z"
  --   },
  --   {
  --     "step": 2,
  --     "type": "reasoning",
  --     "thinking": "Based on top tracks, I'll search for genre trends...",
  --     "timestamp": "2025-01-22T10:30:05Z"
  --   }
  -- ]

  -- Output
  outcome JSONB, -- Final structured output
  -- Example: {
  --   "insights": ["Your top genre is indie rock", "Emerging trend: bedroom pop"],
  --   "data": {...},
  --   "visualization_config": {...}
  -- }

  -- Performance metrics
  total_tokens INTEGER,
  total_cost DECIMAL(10,6),
  duration_ms INTEGER,

  -- State
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for executions
CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_agent_executions_widget_id ON agent_executions(widget_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_started_at ON agent_executions(started_at DESC);

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- Agents policies
CREATE POLICY "Users can view agents in their client"
  ON agents FOR SELECT
  USING (client_id IN (SELECT client_id FROM get_user_clients(auth.uid())));

CREATE POLICY "Users can create agents in their client"
  ON agents FOR INSERT
  WITH CHECK (client_id IN (SELECT client_id FROM get_user_clients(auth.uid())));

CREATE POLICY "Users can update agents in their client"
  ON agents FOR UPDATE
  USING (client_id IN (SELECT client_id FROM get_user_clients(auth.uid())));

CREATE POLICY "Users can delete agents in their client"
  ON agents FOR DELETE
  USING (client_id IN (SELECT client_id FROM get_user_clients(auth.uid())));

-- Agent executions policies
CREATE POLICY "Users can view executions in their client"
  ON agent_executions FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE client_id IN (SELECT client_id FROM get_user_clients(auth.uid()))
    )
  );

CREATE POLICY "Users can create executions in their client"
  ON agent_executions FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE client_id IN (SELECT client_id FROM get_user_clients(auth.uid()))
    )
  );

-- =============================================
-- 4. HELPER FUNCTIONS
-- =============================================

-- Function to get agent with executions stats
CREATE OR REPLACE FUNCTION get_agent_stats(agent_uuid UUID)
RETURNS TABLE (
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  total_cost NUMERIC,
  last_execution_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_executions,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_executions,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_executions,
    AVG(duration_ms) as avg_duration_ms,
    SUM(total_cost) as total_cost,
    MAX(started_at) as last_execution_at
  FROM agent_executions
  WHERE agent_id = agent_uuid;
END;
$$;

-- =============================================
-- 5. SAMPLE DATA (Optional - for testing)
-- =============================================

-- Uncomment to insert sample agent:
-- INSERT INTO agents (client_id, name, description, system_prompt, available_tools)
-- SELECT
--   c.id,
--   'Music Trend Analyzer',
--   'Analyzes your music taste and finds emerging trends',
--   'You are a music trend analyst. Use Spotify to get user''s top tracks, Last.fm for genre information, and Nextatlas for trend data. Provide insightful analysis combining all sources.',
--   '[
--     {"type": "integration", "name": "spotify_top_tracks"},
--     {"type": "integration", "name": "lastfm_artist_info"},
--     {"type": "integration", "name": "nextatlas_trends"}
--   ]'::jsonb
-- FROM clients c
-- LIMIT 1;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
