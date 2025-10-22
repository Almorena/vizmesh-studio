-- Fix infinite recursion in RLS policies - Version 2
-- Simplify even more to avoid ALL recursion

-- 1. Drop ALL existing policies completely
DROP POLICY IF EXISTS "Users can view their clients" ON clients;
DROP POLICY IF EXISTS "Owners and admins can update clients" ON clients;
DROP POLICY IF EXISTS "Owners can delete clients" ON clients;
DROP POLICY IF EXISTS "Service can create clients" ON clients;

DROP POLICY IF EXISTS "Users can view their own client memberships" ON client_users;
DROP POLICY IF EXISTS "Users can view client members" ON client_users;
DROP POLICY IF EXISTS "Owners and admins can add members" ON client_users;
DROP POLICY IF EXISTS "Owners and admins can update members" ON client_users;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON client_users;

-- 2. Temporarily disable RLS to allow service operations
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_users DISABLE ROW LEVEL SECURITY;

-- We'll use service role for operations and handle security at application level for now
-- This is a temporary simplification - we can add back proper RLS later

-- Note: This means we'll need to add client_id checks in our API routes
-- But it will allow the system to work without recursion issues
