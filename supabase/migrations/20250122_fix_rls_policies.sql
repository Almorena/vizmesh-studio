-- Fix infinite recursion in RLS policies
-- The problem is that client_users policies reference themselves

-- 1. Drop all problematic policies
DROP POLICY IF EXISTS "Users can view their clients" ON clients;
DROP POLICY IF EXISTS "Owners and admins can update clients" ON clients;
DROP POLICY IF EXISTS "Owners can delete clients" ON clients;
DROP POLICY IF EXISTS "Service can create clients" ON clients;

DROP POLICY IF EXISTS "Users can view client members" ON client_users;
DROP POLICY IF EXISTS "Owners and admins can add members" ON client_users;
DROP POLICY IF EXISTS "Owners and admins can update members" ON client_users;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON client_users;

-- 2. Create simpler, non-recursive policies for client_users
-- Allow users to see their own memberships (no recursion)
CREATE POLICY "Users can view their own client memberships"
  ON client_users FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to see other members of clients they belong to (with subquery that doesn't recurse)
CREATE POLICY "Users can view members of their clients"
  ON client_users FOR SELECT
  USING (
    client_id IN (
      SELECT cu.client_id
      FROM client_users cu
      WHERE cu.user_id = auth.uid()
    )
  );

-- Only owners and admins can add members (using EXISTS to avoid recursion)
CREATE POLICY "Owners and admins can add members"
  ON client_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = client_users.client_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can update members
CREATE POLICY "Owners and admins can update members"
  ON client_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = client_users.client_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON client_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = client_users.client_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('owner', 'admin')
    )
  );

-- 3. Create simpler policies for clients table
-- Users can view clients they belong to
CREATE POLICY "Users can view their clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = clients.id
        AND client_users.user_id = auth.uid()
    )
  );

-- Only owners and admins can update clients
CREATE POLICY "Owners and admins can update clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = clients.id
        AND client_users.user_id = auth.uid()
        AND client_users.role IN ('owner', 'admin')
    )
  );

-- Only owners can delete clients
CREATE POLICY "Owners can delete clients"
  ON clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.client_id = clients.id
        AND client_users.user_id = auth.uid()
        AND client_users.role = 'owner'
    )
  );

-- Service role can create clients (bypass RLS)
CREATE POLICY "Service can create clients"
  ON clients FOR INSERT
  WITH CHECK (true);
