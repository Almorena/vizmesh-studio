-- Add widget data cache table
CREATE TABLE IF NOT EXISTS widget_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(widget_id)
);

-- Add index for faster lookups
CREATE INDEX idx_widget_data_cache_widget_id ON widget_data_cache(widget_id);
CREATE INDEX idx_widget_data_cache_updated_at ON widget_data_cache(updated_at);

-- Add RLS policies
ALTER TABLE widget_data_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access data for their own widgets
CREATE POLICY "Users can view their own widget data"
  ON widget_data_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM widgets w
      JOIN dashboards d ON w.dashboard_id = d.id
      WHERE w.id = widget_data_cache.widget_id
      AND d.user_id = auth.uid()
    )
  );

-- Users can insert/update data for their own widgets
CREATE POLICY "Users can insert their own widget data"
  ON widget_data_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM widgets w
      JOIN dashboards d ON w.dashboard_id = d.id
      WHERE w.id = widget_data_cache.widget_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own widget data"
  ON widget_data_cache
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM widgets w
      JOIN dashboards d ON w.dashboard_id = d.id
      WHERE w.id = widget_data_cache.widget_id
      AND d.user_id = auth.uid()
    )
  );

-- Add last_refreshed_at column to dashboards
ALTER TABLE dashboards
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP WITH TIME ZONE;

-- Update last_refreshed_at trigger
CREATE OR REPLACE FUNCTION update_dashboard_refresh_time()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dashboards
  SET last_refreshed_at = NOW()
  WHERE id = (
    SELECT dashboard_id FROM widgets WHERE id = NEW.widget_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboard_refresh
AFTER INSERT OR UPDATE ON widget_data_cache
FOR EACH ROW
EXECUTE FUNCTION update_dashboard_refresh_time();
