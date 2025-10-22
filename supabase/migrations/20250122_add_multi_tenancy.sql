-- Multi-tenancy Migration
-- This migration adds client/tenant support to VizMesh Studio

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create client_users junction table (many-to-many)
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

-- 3. Add client_id to existing tables
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_client_id ON dashboards(client_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_client_id ON data_sources(client_id);

-- 5. Add trigger for clients updated_at
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Enable RLS on new tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for clients table
-- Users can only view clients they belong to
CREATE POLICY "Users can view their clients"
  ON clients FOR SELECT
  USING (id IN (
    SELECT client_id FROM client_users WHERE user_id = auth.uid()
  ));

-- Only owners and admins can update clients
CREATE POLICY "Owners and admins can update clients"
  ON clients FOR UPDATE
  USING (id IN (
    SELECT client_id FROM client_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ));

-- Only owners can delete clients
CREATE POLICY "Owners can delete clients"
  ON clients FOR DELETE
  USING (id IN (
    SELECT client_id FROM client_users
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ));

-- Service role can create clients
CREATE POLICY "Service can create clients"
  ON clients FOR INSERT
  WITH CHECK (true);

-- 8. RLS Policies for client_users table
-- Users can view members of their clients
CREATE POLICY "Users can view client members"
  ON client_users FOR SELECT
  USING (client_id IN (
    SELECT client_id FROM client_users WHERE user_id = auth.uid()
  ));

-- Owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON client_users FOR INSERT
  WITH CHECK (client_id IN (
    SELECT client_id FROM client_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ));

-- Owners and admins can update members
CREATE POLICY "Owners and admins can update members"
  ON client_users FOR UPDATE
  USING (client_id IN (
    SELECT client_id FROM client_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ));

-- Owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON client_users FOR DELETE
  USING (client_id IN (
    SELECT client_id FROM client_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ));

-- 9. Update existing RLS policies for dashboards
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can create their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can update their own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can delete their own dashboards" ON dashboards;

-- Create new policies with client_id check
CREATE POLICY "Users can view dashboards in their clients"
  ON dashboards FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dashboards in their clients"
  ON dashboards FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dashboards in their clients"
  ON dashboards FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dashboards in their clients"
  ON dashboards FOR DELETE
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- 10. Update existing RLS policies for data_sources
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own data sources" ON data_sources;
DROP POLICY IF EXISTS "Users can create their own data sources" ON data_sources;
DROP POLICY IF EXISTS "Users can update their own data sources" ON data_sources;
DROP POLICY IF EXISTS "Users can delete their own data sources" ON data_sources;

-- Create new policies with client_id check
CREATE POLICY "Users can view data sources in their clients"
  ON data_sources FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create data sources in their clients"
  ON data_sources FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update data sources in their clients"
  ON data_sources FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete data sources in their clients"
  ON data_sources FOR DELETE
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- 11. Helper function to get user's clients
CREATE OR REPLACE FUNCTION get_user_clients(p_user_id UUID)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  client_slug TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    cu.role
  FROM clients c
  INNER JOIN client_users cu ON c.id = cu.client_id
  WHERE cu.user_id = p_user_id
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Helper function to check if user has access to client
CREATE OR REPLACE FUNCTION user_has_client_access(p_user_id UUID, p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_users
    WHERE user_id = p_user_id AND client_id = p_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Helper function to get user's role in client
CREATE OR REPLACE FUNCTION get_user_role_in_client(p_user_id UUID, p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM client_users
  WHERE user_id = p_user_id AND client_id = p_client_id;

  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
