-- Delete all widgets to fix rendering issues
-- This will allow you to recreate them with the fixed code

-- Show widgets before deletion
SELECT id, title, created_at FROM widgets ORDER BY created_at DESC;

-- Delete all widgets
DELETE FROM widgets;

-- Verify deletion
SELECT COUNT(*) as remaining_widgets FROM widgets;
