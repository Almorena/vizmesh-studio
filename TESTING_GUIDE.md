# VizMesh Studio - Complete Testing Guide

## System Status

**Development Server**: http://localhost:3003
**Status**: Running ✅

## What's Been Implemented

### 1. Core Features
- ✅ Authentication (Supabase email/password)
- ✅ Dashboard creation and management
- ✅ AI-powered widget generation (OpenAI GPT-4 Turbo)
- ✅ Widget rendering in secure iframe sandbox
- ✅ Chart.js integration with custom React wrappers
- ✅ API usage tracking and cost monitoring

### 2. Integration System (NEW)
- ✅ Generic integration types (API, Agent, Database, Custom)
- ✅ AI-powered integration configuration
- ✅ Manual JSON configuration
- ✅ Data fetching from real integrations
- ✅ Automatic data loading in widgets

## Complete Test Flow

### Test 1: Basic Widget with Mock Data (Static)

1. Navigate to http://localhost:3003
2. Sign in with your account
3. Create or open a dashboard
4. Click "Add Widget"
5. Enter prompt: **"Show a bar chart of monthly sales"**
6. Wait for AI to generate the widget
7. **Expected**: Widget displays with mock data

**What happens**:
- GPT-4 generates a widget with static mock data
- `dataSource.type` = "static"
- Data is embedded in `dataSource.config.data`
- Widget renders immediately

---

### Test 2: Integration Setup with AI Assistant

1. Navigate to http://localhost:3003/integrations
2. Click "Add Integration"
3. **Toggle ON** "Use AI Assistant"
4. Enter prompt: **"Connect to JSONPlaceholder API for fake data"**
5. Click "Generate with AI"

**Expected AI Output**:
```json
{
  "name": "JSONPlaceholder API",
  "type": "api",
  "config": {
    "baseUrl": "https://jsonplaceholder.typicode.com",
    "apiKey": "",
    "provider": "jsonplaceholder"
  }
}
```

6. Review the generated config
7. Click "Add Integration"
8. **Expected**: Integration appears in the list

---

### Test 3: Widget with Real API Data

**Prerequisites**: JSONPlaceholder integration from Test 2

1. Go back to your dashboard
2. Click "Add Widget"
3. Enter prompt: **"Show a table of users from JSONPlaceholder"**
4. Wait for AI to generate

**What should happen**:
- AI detects the JSONPlaceholder integration
- Sets `dataSource.type` = "api"
- Sets `dataSource.config.sourceId` = (UUID of integration)
- Sets `dataSource.config.endpoint` = "/users"
- Widget automatically fetches real data via `/api/fetch-data`
- Displays actual users from JSONPlaceholder API

---

### Test 4: Manual Integration Configuration

1. Navigate to /integrations
2. Click "Add Integration"
3. **Keep "Use AI Assistant" OFF**
4. Fill in manually:
   - **Name**: "Last.fm Music API"
   - **Type**: API
   - **Configuration**:
   ```json
   {
     "provider": "lastfm",
     "baseUrl": "https://ws.audioscrobbler.com/2.0",
     "apiKey": "YOUR_LASTFM_API_KEY",
     "format": "json"
   }
   ```
5. Click "Add Integration"
6. **Expected**: Integration saved successfully

---

### Test 5: Check API Usage Tracking

1. Navigate to http://localhost:3003/usage
2. **Expected**: See all API calls listed with:
   - Provider (openai)
   - Model (gpt-4-turbo-preview)
   - Token counts (input/output/total)
   - Estimated cost in USD
   - Timestamp
3. Check summary cards at top:
   - Total Tokens Used
   - Total Cost
   - API Calls Count

---

## Debugging

### Check Server Logs

Watch the terminal where `pnpm dev` is running for:

```
[AI] Generating widget from prompt: ...
[AI] Widget generated successfully: ...
[Fetch Data] Request: { sourceId: '...', endpoint: '/users' }
[API Fetch] Calling: https://jsonplaceholder.typicode.com/users
[Fetch Data] Success, records: 10
```

### Browser Console

Check browser console for:

```
[WidgetWithData] Fetching from source: abc-123-uuid
[WidgetWithData] Data fetched successfully: [...]
[WidgetRenderer] Received message: { type: 'WIDGET_READY' }
```

### Common Issues

**Issue**: "Integration not found"
- **Fix**: Make sure you're using the correct integration ID
- Check: `GET /api/data-sources` returns your integration

**Issue**: "Failed to fetch data"
- **Fix**: Check the API endpoint is correct
- Check: Network tab shows the actual API request
- Check: Integration config has valid `baseUrl`

**Issue**: Widget shows loading spinner forever
- **Fix**: Check browser console for errors
- Check: iframe console for Babel/React errors
- Check: Widget code doesn't have syntax errors

---

## Architecture Flow

### Static Widget (Mock Data)
```
User Prompt
  → AI generates widget with static data
  → Widget saved to DB with dataSource.type = "static"
  → WidgetWithData detects static type
  → Passes data directly to WidgetRenderer
  → Chart renders immediately
```

### Dynamic Widget (Real Integration)
```
User Prompt
  → AI detects matching integration
  → AI generates widget with dataSource.sourceId
  → Widget saved to DB
  → WidgetWithData detects sourceId
  → Fetches data: POST /api/fetch-data { sourceId, endpoint, params }
  → /api/fetch-data loads integration config from DB
  → Makes actual API call to external service
  → Returns data to widget
  → WidgetWithData passes data to WidgetRenderer
  → Chart renders with real data
```

---

## API Endpoints Reference

### Widget Generation
```
POST /api/ai/generate-widget
Body: { prompt: "Create a chart..." }
Response: { widget: {...}, explanation: "...", suggestions: [] }
```

### Integration AI Generation
```
POST /api/ai/generate-integration
Body: { prompt: "Connect to Spotify API" }
Response: { name: "...", type: "api", config: {...} }
```

### Data Fetching
```
POST /api/fetch-data
Body: {
  sourceId: "uuid",
  endpoint: "/users",
  params: { query: { limit: 10 } }
}
Response: { data: [...] }
```

### Integrations CRUD
```
GET /api/data-sources
POST /api/data-sources { name, type, config }
DELETE /api/data-sources?id=uuid
```

### API Usage Tracking
```
GET /api/usage
GET /api/usage/summary
```

---

## Example Integrations to Test

### 1. JSONPlaceholder (No Auth)
```json
{
  "name": "JSONPlaceholder",
  "type": "api",
  "config": {
    "baseUrl": "https://jsonplaceholder.typicode.com"
  }
}
```

**Test widget prompt**: "Show a list of posts from JSONPlaceholder"
**Expected endpoint**: `/posts`

### 2. CoinGecko (No Auth)
```json
{
  "name": "CoinGecko Crypto API",
  "type": "api",
  "config": {
    "baseUrl": "https://api.coingecko.com/api/v3"
  }
}
```

**Test widget prompt**: "Show top 10 cryptocurrencies"
**Expected endpoint**: `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10`

### 3. GitHub API (With Token)
```json
{
  "name": "GitHub API",
  "type": "api",
  "config": {
    "baseUrl": "https://api.github.com",
    "apiKey": "github_pat_YOUR_TOKEN",
    "headers": {
      "Accept": "application/vnd.github.v3+json"
    }
  }
}
```

**Test widget prompt**: "Show my GitHub repositories"
**Expected endpoint**: `/user/repos`

---

## Success Criteria

All tests pass when:

1. ✅ Static widgets render with mock data
2. ✅ AI generates appropriate integration configs
3. ✅ Manual integration creation works
4. ✅ Widgets detect and use matching integrations
5. ✅ Real API data fetches successfully
6. ✅ Widgets display real data from integrations
7. ✅ API usage tracking records all calls
8. ✅ Error handling shows helpful messages

---

## Next Steps (Future Enhancements)

### Phase 1: OAuth Support
- [ ] Implement OAuth 2.0 flow for Spotify, Google, etc.
- [ ] Store and refresh access tokens
- [ ] Handle token expiration

### Phase 2: Database Integrations
- [ ] Support PostgreSQL, MySQL connections
- [ ] Query builder UI
- [ ] Connection pooling

### Phase 3: Agent Integrations
- [ ] LangGraph agent integration
- [ ] Custom AI agent support
- [ ] Streaming responses

### Phase 4: Advanced Features
- [ ] Real-time data updates (WebSocket)
- [ ] Data caching and refresh strategies
- [ ] Rate limiting per integration
- [ ] Integration marketplace with templates

---

## Files Modified in This Session

1. `/app/api/fetch-data/route.ts` - NEW data fetching endpoint
2. `/app/api/ai/generate-widget/route.ts` - Enhanced to use integrations
3. `/app/integrations/page.tsx` - Generic types + AI assistant
4. `/app/api/ai/generate-integration/route.ts` - NEW AI config generator
5. `/components/canvas/widget-with-data.tsx` - NEW wrapper component
6. `/app/dashboard/[id]/page.tsx` - Uses WidgetWithData component
7. `/INTEGRATION_SYSTEM.md` - Integration documentation
8. `/TESTING_GUIDE.md` - This file

---

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check terminal for server errors
3. Verify environment variables in `.env.local`
4. Check Supabase database tables are created
5. Verify OpenAI API key is valid and has credits

**Server running at**: http://localhost:3003
