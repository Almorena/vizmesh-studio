# Deploy VizMesh Studio su Vercel

Guida rapida per deployare VizMesh Studio su Vercel e abilitare OAuth con Spotify/GitHub.

## Perché Vercel?

- ✅ **HTTPS gratuito** - necessario per OAuth di Spotify, GitHub, etc.
- ✅ **Deploy automatico** - ogni push su GitHub
- ✅ **URL permanente** - `https://vizmesh-studio.vercel.app`
- ✅ **Gratis** per progetti personali
- ✅ **Variabili d'ambiente** - gestione sicura delle credenziali

## Setup Rapido (5 minuti)

### 1. Installa Vercel CLI

```bash
npm install -g vercel
```

### 2. Login su Vercel

```bash
vercel login
```

### 3. Deploy dal progetto

```bash
cd /Users/alessiomorena/Projects/ClaudeCode/vizmesh-studio
vercel
```

Rispondi alle domande:
- **Set up and deploy?** → Yes
- **Which scope?** → Il tuo account
- **Link to existing project?** → No
- **Project name?** → vizmesh-studio (o altro nome)
- **Directory?** → `./` (lascia vuoto, premi Enter)
- **Override settings?** → No

### 4. Ottieni il tuo URL

Vercel ti darà un URL tipo:
```
✅ Production: https://vizmesh-studio-abc123.vercel.app
```

### 5. Configura Environment Variables su Vercel

Vai su https://vercel.com/dashboard e:

1. Seleziona il tuo progetto `vizmesh-studio`
2. Vai su **Settings** → **Environment Variables**
3. Aggiungi queste variabili:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://adjajkhlkvjjltbaommx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# App URL (usa il tuo URL Vercel!)
NEXT_PUBLIC_APP_URL=https://vizmesh-studio-abc123.vercel.app
```

### 6. Redeploy

```bash
vercel --prod
```

## Configurare OAuth con il tuo URL Vercel

### Spotify

1. Vai su https://developer.spotify.com/dashboard
2. Seleziona la tua app → **Settings**
3. In **Redirect URIs**, aggiungi:
   ```
   https://vizmesh-studio-abc123.vercel.app/api/oauth/callback
   ```
4. **Save**

### GitHub

1. Vai su https://github.com/settings/developers
2. Seleziona la tua OAuth App → **Edit**
3. In **Authorization callback URL**, metti:
   ```
   https://vizmesh-studio-abc123.vercel.app/api/oauth/callback
   ```
4. **Update application**

## Sviluppo Locale con OAuth

Puoi continuare a sviluppare in locale, ma usare l'app Vercel per l'OAuth:

1. **Locale**: `npm run dev` su http://localhost:3003
2. **OAuth**: Quando clicchi "Connect with Spotify", usa temporaneamente la versione Vercel
3. Dopo il collegamento, il token è salvato nel database e funziona anche in locale

## Deploy Automatico con GitHub

### 1. Crea un repository GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tuousername/vizmesh-studio.git
git push -u origin main
```

### 2. Collega Vercel a GitHub

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto → **Settings** → **Git**
3. Collega il repository GitHub

### 3. Deploy Automatico

Ora ogni `git push` farà automaticamente il deploy su Vercel! 🚀

## Comandi Utili

```bash
# Deploy in produzione
vercel --prod

# Deploy preview (per testare)
vercel

# Vedere i logs in tempo reale
vercel logs

# Rimuovere un deployment
vercel remove [deployment-url]

# Aprire il progetto su Vercel dashboard
vercel open
```

## Variabili d'Ambiente

### Production

Le variabili configurate su Vercel dashboard vengono usate automaticamente in produzione.

### Development

Per sviluppo locale, usa `.env.local` (già presente nel progetto).

### Preview

I deploy preview usano le variabili di production di default. Puoi configurare variabili specifiche per preview su Vercel dashboard.

## Domini Personalizzati

### Aggiungere un Dominio Custom

1. Vai su **Settings** → **Domains**
2. Aggiungi il tuo dominio (es. `vizmesh.app`)
3. Segui le istruzioni per configurare DNS
4. Vercel fornisce automaticamente HTTPS

### Dopo aver aggiunto il dominio:

1. Aggiorna `NEXT_PUBLIC_APP_URL` su Vercel
2. Aggiorna i redirect URI su Spotify/GitHub:
   ```
   https://vizmesh.app/api/oauth/callback
   ```

## Troubleshooting

### Errore: "NEXT_PUBLIC_APP_URL is not defined"

**Soluzione**: Aggiungi la variabile su Vercel dashboard e redeploy.

### Errore: "Invalid redirect URI" dopo deploy

**Soluzione**: Verifica che il redirect URI su Spotify/GitHub corrisponda ESATTAMENTE all'URL Vercel (incluso `https://` e `/api/oauth/callback`).

### Variabili d'ambiente non aggiornate

**Soluzione**: Dopo aver modificato variabili su Vercel, devi sempre redeployare:
```bash
vercel --prod
```

### Build fallisce

**Soluzione**: Controlla i logs:
```bash
vercel logs
```

Spesso è un problema di TypeScript o dipendenze mancanti.

## Best Practices

1. **Mai committare `.env.local`** - è già in `.gitignore`
2. **Usa variabili diverse per prod/dev** - specialmente per database e API keys
3. **Testa sempre con `vercel` prima di `vercel --prod`** - i deploy preview sono gratis
4. **Monitora l'usage** - Vercel ha limiti sul piano gratuito (100GB bandwidth/mese)

## Link Utili

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js su Vercel](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Domande?** Controlla i logs con `vercel logs` o apri un issue!
