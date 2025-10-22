# VizMesh Studio - Deployment Checklist per Vercel

Questa è una checklist completa per il deployment su Vercel con OAuth funzionante.

## ✅ Checklist Configurazioni

### 1. Vercel Environment Variables
- [ ] Vai su: https://vercel.com/alessio-5126s-projects/vizmesh-studio/settings/environment-variables
- [ ] Aggiungi `NEXT_PUBLIC_APP_URL`
  - **Name**: `NEXT_PUBLIC_APP_URL`
  - **Value**: `https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app`
  - **Environment**: Production, Preview, Development
- [ ] Aggiungi tutte le altre variabili da `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`

### 2. Supabase - URL Configuration
- [ ] Vai su: https://supabase.com/dashboard/project/adjajkhlkvjjltbaommx/auth/url-configuration
- [ ] **Site URL**: `https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app`
- [ ] **Redirect URLs** (aggiungi tutti questi):
  ```
  https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app/auth/callback
  https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app/**
  http://localhost:3000/auth/callback
  http://localhost:3000/**
  ```
- [ ] Clicca **Save**

### 3. Google Cloud Console - OAuth
- [ ] Vai su: https://console.cloud.google.com/apis/credentials
- [ ] Seleziona il tuo OAuth 2.0 Client ID
- [ ] **Authorized redirect URIs** - aggiungi:
  ```
  https://adjajkhlkvjjltbaommx.supabase.co/auth/v1/callback
  http://localhost:54321/auth/v1/callback
  ```
- [ ] **Authorized JavaScript origins** (opzionale):
  ```
  https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app
  http://localhost:3000
  ```
- [ ] Clicca **Save**

### 4. Spotify Developer Dashboard (opzionale)
- [ ] Vai su: https://developer.spotify.com/dashboard
- [ ] Apri la tua app VizMesh Studio
- [ ] **Redirect URIs** - aggiungi:
  ```
  https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app/api/oauth/callback/spotify
  http://localhost:3000/api/oauth/callback/spotify
  ```
- [ ] Clicca **Save**

---

## 🔍 Troubleshooting

### Problema: Resta su `/auth` dopo login Google

**Sintomi**: Dopo aver fatto login con Google, vieni reindirizzato a `/auth` ma non succede nulla.

**Diagnosi**:
1. Apri Developer Tools (F12) → Console
2. Controlla se ci sono errori JavaScript
3. Guarda l'URL completo - c'è `?code=...` nell'URL?
4. Vai su Application → Cookies e controlla se ci sono cookies di Supabase

**Possibili cause e soluzioni**:

#### Causa 1: Supabase redirect URL non configurato
- **Verifica**: Controlla la configurazione URL in Supabase
- **Soluzione**: Assicurati che `/auth/callback` sia nei Redirect URLs

#### Causa 2: AuthContext non riceve l'utente
- **Verifica**: Apri Console → scrivi `localStorage.getItem('supabase.auth.token')`
- **Soluzione**: Se null, la sessione non si è creata. Controlla Google Cloud redirect URI.

#### Causa 3: Google OAuth redirect URI errato
- **Verifica**: Il redirect URI di Google DEVE puntare a Supabase, NON alla tua app
- **Soluzione**: Il redirect URI corretto è: `https://adjajkhlkvjjltbaommx.supabase.co/auth/v1/callback`

#### Causa 4: Environment variables mancanti
- **Verifica**: Controlla che `NEXT_PUBLIC_APP_URL` sia configurato su Vercel
- **Soluzione**: Aggiungi la variabile e fai redeploy

---

## 🎯 Flusso OAuth Corretto

### Google OAuth Flow:

```
1. User clicks "Continue with Google" su /auth
   ↓
2. Browser → Google OAuth consent screen
   ↓
3. User approva
   ↓
4. Google → Supabase callback URL:
   https://adjajkhlkvjjltbaommx.supabase.co/auth/v1/callback?code=...
   ↓
5. Supabase scambia code per token e crea sessione
   ↓
6. Supabase → App redirect URL (configurato in Site URL):
   https://vizmesh-studio-7wuau4vus-alessio-5126s-projects.vercel.app/auth/callback?code=...
   ↓
7. App route handler /auth/callback:
   - Scambia code per session
   - Redirect to /
   ↓
8. User arriva su homepage autenticato ✅
```

### Punti critici:
- **Google redirect URI** → DEVE puntare a Supabase (`*.supabase.co/auth/v1/callback`)
- **Supabase Site URL** → DEVE puntare alla tua app Vercel
- **Supabase Redirect URLs** → DEVE includere `/auth/callback`

---

## 🧪 Test Manuale

### Test 1: Verifica sessione Supabase
```javascript
// Apri Console del browser e esegui:
const supabase = createClient(
  'https://adjajkhlkvjjltbaommx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
)
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)
```

### Test 2: Verifica cookies
```javascript
// Console:
document.cookie
// Dovrebbe mostrare cookies di supabase-auth-token
```

### Test 3: Verifica AuthContext
```javascript
// Aggiungi console.log temporanei in auth-context.tsx:
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('🔐 Session loaded:', session)
    setUser(session?.user ?? null)
    setLoading(false)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event, session)
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [supabase])
```

---

## 📞 Contatti

Se il problema persiste, raccogli queste informazioni:
1. Screenshot della Console (F12 → Console)
2. Screenshot della tab Network (F12 → Network) durante il login
3. URL completo dopo il redirect
4. Screenshot delle configurazioni Supabase e Google Cloud
