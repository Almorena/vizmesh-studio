-- Add column_span to widgets table
ALTER TABLE widgets
ADD COLUMN column_span INTEGER DEFAULT 1 CHECK (column_span IN (1, 2, 3));

-- Update existing widgets to have column_span 1
UPDATE widgets SET column_span = 1 WHERE column_span IS NULL;
