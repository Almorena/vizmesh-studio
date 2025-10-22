-- Seed script to create a test client
-- This creates a "Nextatlas" client and associates the current user with it

-- Insert a test client
INSERT INTO clients (name, slug, settings)
VALUES (
  'Nextatlas',
  'nextatlas',
  '{"theme": "neutral", "features": ["dashboards", "integrations", "ai"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Get the client_id for Nextatlas
DO $$
DECLARE
  client_uuid UUID;
BEGIN
  SELECT id INTO client_uuid FROM clients WHERE slug = 'nextatlas';

  -- Update all existing dashboards to belong to Nextatlas client
  UPDATE dashboards
  SET client_id = client_uuid
  WHERE client_id IS NULL;

  -- Update all existing data_sources to belong to Nextatlas client
  UPDATE data_sources
  SET client_id = client_uuid
  WHERE client_id IS NULL;

  -- Add all existing users to Nextatlas as owners
  INSERT INTO client_users (client_id, user_id, role)
  SELECT client_uuid, id, 'owner'
  FROM auth.users
  ON CONFLICT (client_id, user_id) DO NOTHING;

  RAISE NOTICE 'Nextatlas client created and all existing data migrated';
END $$;
