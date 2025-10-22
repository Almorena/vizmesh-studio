-- Remove Nextatlas usage records (free API, should not be tracked)
-- This will clean up any existing records for free APIs

-- Delete Nextatlas records
DELETE FROM api_usage
WHERE model ILIKE '%nextatlas%'
   OR provider ILIKE '%nextatlas%';

-- Also delete other free API records that may have been tracked by mistake
DELETE FROM api_usage
WHERE model ILIKE '%spotify%'
   OR model ILIKE '%lastfm%'
   OR model ILIKE '%last.fm%'
   OR model ILIKE '%jsonplaceholder%'
   OR provider ILIKE '%spotify%'
   OR provider ILIKE '%lastfm%';

-- Show remaining records count
SELECT
  provider,
  model,
  COUNT(*) as record_count,
  SUM(estimated_cost::numeric) as total_cost
FROM api_usage
GROUP BY provider, model
ORDER BY total_cost DESC;
