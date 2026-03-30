# Deploying Second Brain MCP Server Online

The HTTP wrapper (`src/http-server.ts`) exposes the MCP server as a REST API, making it deployable to free hosting platforms.

## Local Testing

```bash
# Development
npm run dev:http

# Production (compiled)
npm run start:http

# Server listens on $PORT (default 3000)
# Try: curl http://localhost:3000/
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info & available endpoints |
| `/health` | GET | Server status check |
| `/documents` | GET | List all indexed documents |
| `/search` | GET/POST | Search documents (query, limit params) |
| `/document/:slug` | GET | Fetch full document by slug |

### Example Requests

```bash
# Get API info
curl http://localhost:3000/

# Search for "job queue"
curl "http://localhost:3000/search?query=job+queue&limit=5"

# Search with POST (JSON body)
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "AudioForge", "limit": 3}'

# Get full document
curl http://localhost:3000/document/projects/audio-forge
```

## Deployment Options

### Option 1: Render (Free Tier) ⭐ Recommended

**Pros**: Free tier includes static builds, always-on, GitHub integration
**Cons**: Spins down after 15 min inactivity on free tier

1. **Create account**: [render.com](https://render.com)
2. **Connect GitHub**: Authorize access to second-brain repo
3. **Create Web Service**:
   - Name: `second-brain-mcp`
   - Repository: `JasonBBelcher/second-brain`
   - Branch: `main`
   - Build Command: `cd mcp && npm install && npm run build`
   - Start Command: `cd mcp && npm run start:http`
   - Environment: `PORT` = `3000` (auto-set)
4. **Deploy**: Click "Create Web Service"
5. **Get URL**: `https://second-brain-mcp.onrender.com`

### Option 2: Railway (Free Tier)

**Pros**: Free $5/month credit, more performant than Render
**Cons**: Requires credit card, credit runs out after 1-2 months free use

1. **Create account**: [railway.app](https://railway.app)
2. **New Project** → GitHub Repository → second-brain
3. **Configure**:
   - Root Directory: `mcp`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:http`
4. **Deploy**: Railway auto-deploys on GitHub push
5. **Get domain**: Custom domain under project settings

### Option 3: Fly.io (Free Tier)

**Pros**: Free tier with 3 shared CPU VMs, global deployment
**Cons**: Requires credit card, configuration more complex

1. **Install CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Create account**: `flyctl auth signup`
3. **Create app**:
   ```bash
   cd second-brain/mcp
   flyctl launch
   # Follow prompts, choose free tier
   ```
4. **Deploy**:
   ```bash
   flyctl deploy
   ```
5. **View app**: `flyctl open` → Opens live URL

### Option 4: Glitch (Free, Instant)

**Pros**: No account needed initially, live editor
**Cons**: Sleeps after inactivity, limited resources

1. Go to [glitch.com](https://glitch.com)
2. New Project → Import from GitHub
3. Paste: `https://github.com/JasonBBelcher/second-brain`
4. **Set start script** in `package.json`:
   ```json
   "start": "cd mcp && npm run start:http"
   ```
5. Auto-deployed at `https://[project-name].glitch.me`

### Option 5: Self-Host (Free)

If you have a spare machine or old laptop:

```bash
# On your server:
git clone https://github.com/JasonBBelcher/second-brain.git
cd second-brain/mcp
npm install
npm run build

# Start with PM2 (process manager)
npm install -g pm2
pm2 start "npm run start:http" --name second-brain-mcp
pm2 startup
pm2 save

# Expose via ngrok (temporary tunneling)
npx ngrok http 3000
# Gets public URL: https://abc123.ngrok.io
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `production` | Runtime environment |
| `API_KEY` | (none) | **Required for authentication** (see below) |

### API Key Setup

**Generate a secure key** (example):
```bash
# macOS/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Set on your platform**:

**Render**:
- Dashboard → Environment
- Add: `API_KEY=your-generated-key-here`

**Railway**:
- Project → Variables
- Add: `API_KEY=your-generated-key-here`

**Fly.io**:
```bash
flyctl secrets set API_KEY=your-generated-key-here
```

**Self-hosted**:
```bash
export API_KEY=your-generated-key-here
npm run start:http
```

### Using the API Key

Include in requests via:

**Header** (recommended):
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://your-server.com/search?query=AudioForge
```

**Query parameter**:
```bash
curl https://your-server.com/search?query=AudioForge&key=YOUR_API_KEY
```

**Development mode** (no API_KEY set):
- Server runs without authentication
- Useful for local testing
- ⚠️ Do NOT deploy without API_KEY set

---

## Using the Deployed Server

### From Claude Code/Desktop

**Option 1: Keep MCP stdio locally, use HTTP server as reference**
- Local MCP server (stdio) in `~/.claude/settings.json` (best for privacy)
- HTTP server deployed online (optional, for agents on other machines)

**Option 2: Replace MCP with HTTP wrapper**
If you want agents to use the deployed HTTP version instead of local:

Edit `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "second-brain": {
      "command": "curl",
      "args": ["-s", "https://your-deployed-server.com/document/projects/audio-forge"]
    }
  }
}
```

(Less ideal — MCP is designed for stdio, not HTTP. But it works for read-only queries.)

### From Other Applications

Use the HTTP API directly:

```python
# Python example
import requests

# Search
resp = requests.get('https://your-server.com/search',
                    params={'query': 'job queue', 'limit': 5})
results = resp.json()

# Get full document
resp = requests.get('https://your-server.com/document/projects/audio-forge')
doc = resp.json()
print(doc['content'])
```

```javascript
// JavaScript example
const resp = await fetch('https://your-server.com/search?query=AudioForge&limit=3');
const results = await resp.json();
console.log(results);
```

---

## CORS & Security

**CORS enabled** for all origins (since this is public project info).

```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
```

If you deploy, the API is publicly accessible. Don't add sensitive info!

---

## Monitoring & Logs

### Render
- Dashboard → Logs tab shows stderr/stdout

### Railway
- Project → Deployments → View logs

### Fly.io
```bash
flyctl logs
```

### Self-hosted
```bash
pm2 logs second-brain-mcp
```

---

## Auto-Deployment from GitHub

All platforms (Render, Railway, Fly.io, Glitch) auto-deploy on push to `main`:

```bash
git add src/http-server.ts mcp/package.json
git commit -m "chore: update HTTP server"
git push origin main
# → Server redeploys automatically
```

No manual deploy needed after initial setup!

---

## Choosing a Platform

| Use Case | Platform | Reason |
|----------|----------|--------|
| **Quick test** | Glitch | Zero setup, instant |
| **Production** | Render + upgrade to paid | Reliable, GitHub integration |
| **Personal use** | Self-host on old laptop | Free forever, no limits |
| **Global reach** | Fly.io | CDN-like distribution |
| **Best free tier** | Railway (if using credit) | Fast, $5/month credit |

---

## Troubleshooting

### Server won't start
- Check logs for errors
- Ensure `npm install` ran (node_modules exists)
- Verify `npm run build` succeeded

### 404 on endpoints
- Check URL path exactly (`/search` not `/Search`)
- Ensure query params are URL-encoded (`query=job%20queue`)

### Slow search results
- First search may be slow (building index)
- Subsequent searches cached in memory (fast)
- If still slow, increase Render tier

### Server sleeping (Render free tier)
- Make periodic health check requests to keep alive
- Use external monitoring service (uptime robot)
- Upgrade to Render's paid tier ($7/month) for always-on

---

## Next Steps

1. Choose a platform (I recommend **Render** for simplicity)
2. Follow deployment steps above
3. Test with `curl` or Postman
4. Share the public URL with others
5. Use in agents/scripts/third-party tools

That's it! 🚀
