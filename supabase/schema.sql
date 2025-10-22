-- VizMesh Studio Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widgets table
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  title TEXT NOT NULL,
  data_source JSONB NOT NULL,
  visualization JSONB NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  size JSONB DEFAULT '{"width": 400, "height": 300}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources table (for configured connections)
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'api', 'database', 'agent', etc.
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'other'
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Policies for dashboards
CREATE POLICY "Users can view their own dashboards"
  ON dashboards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboards"
  ON dashboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards"
  ON dashboards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards"
  ON dashboards FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for widgets
CREATE POLICY "Users can view widgets in their dashboards"
  ON widgets FOR SELECT
  USING (dashboard_id IN (
    SELECT id FROM dashboards WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create widgets in their dashboards"
  ON widgets FOR INSERT
  WITH CHECK (dashboard_id IN (
    SELECT id FROM dashboards WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update widgets in their dashboards"
  ON widgets FOR UPDATE
  USING (dashboard_id IN (
    SELECT id FROM dashboards WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete widgets in their dashboards"
  ON widgets FOR DELETE
  USING (dashboard_id IN (
    SELECT id FROM dashboards WHERE user_id = auth.uid()
  ));

-- Policies for data sources
CREATE POLICY "Users can view their own data sources"
  ON data_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data sources"
  ON data_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data sources"
  ON data_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data sources"
  ON data_sources FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for api_usage
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert API usage"
  ON api_usage FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- Indexes for better performance
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_widgets_dashboard_id ON widgets(dashboard_id);
CREATE INDEX idx_data_sources_user_id ON data_sources(user_id);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER widgets_updated_at
  BEFORE UPDATE ON widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
