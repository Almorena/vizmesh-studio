-- Add theme column to dashboards table
ALTER TABLE dashboards
ADD COLUMN theme TEXT DEFAULT 'neutral' CHECK (theme IN ('modern', 'neutral', 'dark'));

-- Update existing dashboards to have neutral theme
UPDATE dashboards SET theme = 'neutral' WHERE theme IS NULL;
