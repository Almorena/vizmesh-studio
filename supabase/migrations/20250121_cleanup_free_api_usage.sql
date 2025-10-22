-- Clean up usage records for free APIs that should not be tracked
-- This removes records for Last.fm, JSONPlaceholder, GitHub, OpenWeatherMap, etc.

DELETE FROM api_usage
WHERE
  LOWER(model) LIKE '%lastfm%' OR
  LOWER(model) LIKE '%last.fm%' OR
  LOWER(model) LIKE '%jsonplaceholder%' OR
  LOWER(model) LIKE '%openweathermap%' OR
  LOWER(model) LIKE '%github%' OR
  LOWER(provider) = 'free';

-- Display remaining records count
SELECT
  provider,
  model,
  COUNT(*) as record_count,
  SUM(CAST(estimated_cost AS DECIMAL)) as total_cost
FROM api_usage
GROUP BY provider, model
ORDER BY provider, model;
