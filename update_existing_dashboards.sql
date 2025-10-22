-- Update existing dashboards to have neutral theme if they don't have one
UPDATE dashboards SET theme = 'neutral' WHERE theme IS NULL;

-- Check the current state of dashboards
SELECT id, name, theme, created_at FROM dashboards;
