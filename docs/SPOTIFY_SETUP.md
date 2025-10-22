# Spotify OAuth Setup Guide

This guide will walk you through setting up Spotify OAuth integration in VizMesh Studio.

## Prerequisites

- A Spotify account (free or premium)
- VizMesh Studio running locally on `http://localhost:3003`

## Step 1: Create a Spotify Developer Account

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Accept the Terms of Service if prompted

## Step 2: Create a Spotify App

1. Click **"Create app"** button in the dashboard
2. Fill in the app details:
   - **App name**: `VizMesh Studio` (or any name you prefer)
   - **App description**: `Personal data visualization dashboard`
   - **Website**: `http://localhost:3003` (for local development)
   - **Redirect URIs**: `http://localhost:3003/api/oauth/callback`
     - ⚠️ **IMPORTANT**: This must match exactly, including the protocol (http/https)
   - **APIs used**: Select **Web API**
3. Check the box to agree to Spotify's Developer Terms of Service
4. Click **"Save"**

## Step 3: Get Your Credentials

1. After creating the app, you'll see your app's dashboard
2. Click **"Settings"** button in the top right
3. You'll see two important values:
   - **Client ID**: A long string like `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **Client Secret**: Click **"View client secret"** to reveal it
4. **⚠️ Keep these credentials secure!** Never commit them to version control

## Step 4: Add Integration in VizMesh Studio

1. Open VizMesh Studio at `http://localhost:3003`
2. Navigate to **Integrations** page
3. Click **"Add Integration"** button
4. Fill in the form:
   - **Name**: `Spotify`
   - **Type**: `API`
   - **Configuration (JSON)**:
     ```json
     {
       "provider": "spotify",
       "clientId": "YOUR_CLIENT_ID_HERE",
       "clientSecret": "YOUR_CLIENT_SECRET_HERE",
       "scopes": [
         "user-top-read",
         "user-read-recently-played",
         "user-library-read"
       ]
     }
     ```
   - Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with your actual credentials

5. Click **"Add Integration"**

## Step 5: Connect Your Spotify Account

1. After creating the integration, you'll see a **"Connect with spotify"** button on the integration card
2. Click the button
3. You'll be redirected to Spotify's authorization page
4. Review the permissions and click **"Agree"**
5. You'll be redirected back to VizMesh Studio
6. The integration card will now show a green **"Connected"** status

## Step 6: Create a Spotify Widget

Now you can use AI to create widgets that use your Spotify data!

### Example Prompts:

**Top Tracks Widget:**
```
Create a widget that shows my top 10 Spotify tracks from the last month
Use the Spotify integration
Display as a vertical list with track name, artist, and album art
```

**Recently Played Widget:**
```
Create a widget showing my 5 most recently played tracks on Spotify
Use the Spotify integration
Show track name, artist, and when I played it
```

**Music Stats Widget:**
```
Create a widget showing my Spotify listening statistics
Use the Spotify integration
Display total tracks, top artist, and top genre as cards
```

### Behind the Scenes:

When you create a Spotify widget, VizMesh:

1. **AI generates the widget code** with proper Spotify API calls
2. **Widget uses your integration** by specifying the source ID
3. **VizMesh fetches data** from Spotify API using your OAuth token
4. **Data is passed** to the AI-generated component for rendering

## Available Spotify API Endpoints

Your widgets can fetch data from these endpoints (and more):

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `me/top/tracks` | Get user's top tracks | `time_range`: short_term, medium_term, long_term<br>`limit`: 1-50 |
| `me/top/artists` | Get user's top artists | Same as tracks |
| `me/player/recently-played` | Recently played tracks | `limit`: 1-50 |
| `me/playlists` | User's playlists | `limit`: 1-50 |
| `me/tracks` | User's saved tracks | `limit`: 1-50 |
| `me/albums` | User's saved albums | `limit`: 1-50 |

### Example Widget Fetch Configuration:

```javascript
// In AI-generated widget code
const response = await fetch('/api/fetch-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceId: 'YOUR_INTEGRATION_ID',
    endpoint: 'me/top/tracks',
    params: {
      query: {
        time_range: 'short_term',
        limit: 10
      }
    }
  })
});

const { data } = await response.json();
// data.items contains your top tracks
```

## Troubleshooting

### "Invalid redirect URI" error

**Problem**: Spotify returns an error saying the redirect URI doesn't match.

**Solution**:
1. Check that your Spotify app settings have **exactly**: `http://localhost:3003/api/oauth/callback`
2. Make sure there are no trailing slashes
3. Verify the protocol is `http://` (not `https://`) for localhost

### "Connection not found" error

**Problem**: After OAuth callback, you see "Connection not found" error.

**Solution**:
1. Make sure you created the integration first in VizMesh
2. The integration must be saved to the database before starting OAuth flow
3. Try deleting and recreating the integration

### "Access token expired" error

**Problem**: Widgets stop working after some time.

**Solution**:
- OAuth tokens expire after 1 hour
- Currently, you need to manually reconnect by clicking "Connect with spotify" again
- **Note**: Automatic token refresh will be implemented in a future update

### Widget shows "No data" or empty state

**Problem**: Widget renders but doesn't show any Spotify data.

**Solution**:
1. Check browser console for errors
2. Verify the integration shows "Connected" status
3. Make sure the endpoint and parameters are correct
4. Check that you've granted the necessary scopes (e.g., `user-top-read` for top tracks)

### "Client secret is required" error

**Problem**: OAuth flow fails with this error.

**Solution**:
1. Make sure you included `clientSecret` in your integration config JSON
2. Verify you copied the full secret from Spotify dashboard (it's a long string)
3. Don't confuse Client ID with Client Secret

## Security Best Practices

1. **Never expose your Client Secret**:
   - Don't commit `.env.local` to git
   - Don't share screenshots showing your credentials
   - Don't use Client Secret in frontend code

2. **Use minimal scopes**:
   - Only request the permissions you actually need
   - Review Spotify's [scope documentation](https://developer.spotify.com/documentation/web-api/concepts/scopes)

3. **Rotate credentials if compromised**:
   - If you accidentally expose your Client Secret, reset it in Spotify dashboard
   - Update your integration config with the new secret

## Production Deployment

When deploying to production (e.g., Vercel):

1. **Update Redirect URI** in Spotify app settings:
   - Add: `https://yourdomain.com/api/oauth/callback`
   - Keep localhost URI for local development

2. **Set Environment Variable**:
   - In Vercel dashboard, set `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

3. **Update Integration Config**:
   - No changes needed! The OAuth flow will automatically use the production URL

## Next Steps

- Explore other Spotify API endpoints in the [official documentation](https://developer.spotify.com/documentation/web-api)
- Create custom widgets combining Spotify data with other integrations
- Share your favorite widget designs with the community

## Need Help?

- Check the [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- Review VizMesh Studio troubleshooting guides
- Look at example widgets in the dashboard
