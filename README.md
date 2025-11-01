# ShipStream

> Deploy any GitHub repository in seconds. **100% free-tier compatible**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

**[Live Demo](https://ship-stream.vercel.app/)** • **[Quick Start](#-quick-start)** • **[API Docs](#-api-reference)**

---

## ✨ Features

- ⚡ **Auto-deploy from GitHub URLs** with real-time progress tracking
- 🌐 **Subdomain routing** for instant access to deployed apps
- ☁️ **100% Free Stack**: Cloudflare R2 + Upstash Redis + Render.com
- 🎨 **Modern React UI** with dark mode and deployment history
- 📦 **Multi-framework support**: React, Vue, Next.js, Angular, Vite, and more

## 🏗️ Architecture

```
React Frontend → Upload Service → Deploy Service → Request Handler
   (5173)           (5500)            (5501)           (3000)
                       ↓                 ↓                ↓
                  Cloudflare R2    Upstash Redis   Cloudflare R2
```

**How it works:**
1. User submits GitHub URL → Upload service clones and uploads to R2
2. Build job queued in Redis → Deploy service processes build
3. Built files uploaded to R2 → Request handler serves via subdomain

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Cloudflare R2](https://dash.cloudflare.com/) account (10GB free)
- [Upstash Redis](https://console.upstash.com/) database (10k commands/day free)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd shipstream-platform

# Install all dependencies
cd server/upload-service && npm install
cd ../deploy-service && npm install  
cd ../request-handler && npm install
cd ../../client && npm install
```

### 2. Configure Environment
```bash
cd server
cp .env.example .env
```

Edit `.env` with your credentials:
```env
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=ship-stream
REDIS_URL=rediss://default:password@redis-url.upstash.io:6379
DEPLOY_SERVICE_URL=http://localhost:5501
```

### 3. Build & Start Services
```bash
# Build all services
cd server/upload-service && npm run build
cd ../deploy-service && npm run build
cd ../request-handler && npm run build

# Start services (4 separate terminals)
cd server/upload-service && npm start
cd server/deploy-service && npm start
cd server/request-handler && npm start
cd client && npm run dev
```

### 4. Deploy Your First App
1. Open http://localhost:5173
2. Paste a GitHub URL (e.g., `https://github.com/facebook/create-react-app.git`)
3. Watch real-time deployment progress
4. Access at `http://{id}.localhost:3000`

## 📡 API Reference

### Deploy Repository
```bash
POST http://localhost:5500/send-url
Content-Type: application/json

{
  "repoUrl": "https://github.com/username/react-app.git"
}
```

**Response:**
```json
{
  "generated": "abc123def",
  "files": ["src/App.js", "package.json"]
}
```

### Check Status
```bash
GET http://localhost:5500/status?id=abc123def
```

**Responses:**
- `{"status": "uploaded"}` - Build queued
- `{"status": "deployed"}` - App ready
- `{"status": null}` - Invalid ID

### Access App
```
http://abc123def.localhost:3000
```

## 🌐 Production Deployment

### Deploy to Render.com

**Option 1: One-Click Deploy**
1. Push code to GitHub
2. Go to [Render Dashboard](https://render.com)
3. Click "New" → "Blueprint"
4. Connect repository (Render auto-detects `render.yaml`)

**Option 2: Manual Setup**

Create three web services with these commands:

**Upload Service:**
```bash
Build: cd server/upload-service && npm install && npm run build
Start: cd server/upload-service && npm start
```

**Deploy Service:**
```bash
Build: cd server/deploy-service && npm install && npm run build
Start: cd server/deploy-service && npm start
```

**Request Handler:**
```bash
Build: cd server/request-handler && npm install && npm run build
Start: cd server/request-handler && npm start
```

**Frontend (Vercel/Netlify):**
```bash
cd client && vercel --prod
```

### Environment Variables
Set in Render dashboard:
```env
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket
REDIS_URL=rediss://default:pass@redis.upstash.io:6379
DEPLOY_SERVICE_URL=https://your-deploy-service.onrender.com
NODE_ENV=production
```

Frontend environment:
```env
VITE_API_URL=https://your-upload-service.onrender.com
```

## 🛠️ Supported Frameworks

| Framework | Build Command | Output | Status |
|-----------|---------------|--------|--------|
| React | `npm run build` | `build/` | ✅ |
| Vue.js | `npm run build` | `dist/` | ✅ |
| Next.js | `next build && next export` | `out/` | ✅ |
| Vite | `vite build` | `dist/` | ✅ |
| Angular | `ng build` | `dist/` | ✅ |
| Svelte | `npm run build` | `public/` | ✅ |
| Gatsby | `gatsby build` | `public/` | ✅ |

**Requirements:** Valid `package.json` with build script, static output only

## 🔧 Technology Stack

**Frontend:** React 18 • TypeScript • Vite • Tailwind CSS • Shadcn/ui

**Backend:** Node.js 18 • Express • TypeScript • AWS SDK (R2) • Redis

**Infrastructure:** Cloudflare R2 (10GB free) • Upstash Redis (10k cmds/day) • Render.com (750 hrs/month)

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Verify `package.json` has `build` script |
| Port in use | Windows: `netstat -ano \| findstr :5500` then `taskkill /PID <PID> /F`<br>Mac/Linux: `lsof -i :5500` then `kill -9 <PID>` |
| Redis error | Check `REDIS_URL` format in `.env` |
| R2 upload fails | Verify credentials and bucket name |
| Frontend connection | Update `VITE_API_URL` environment variable |

**Test build locally:**
```bash
cd your-project && npm install && npm run build
ls build/  # or dist/
```

## 🗺️ Roadmap

**Current (v1.0)** ✅
- Basic deployment • Real-time status • Free infrastructure

**Next (v1.1)** 🔄
- Authentication • Custom domains • Build caching • GitHub webhooks

**Future (v2.0)** 📋
- Environment variables • Build logs UI • Team collaboration • Analytics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/amazing`
5. Open Pull Request

**Standards:** TypeScript strict mode • ESLint • Prettier • Conventional Commits

## 📄 License

ISC License - see [LICENSE](LICENSE) file

## 🆘 Support

- 🐛 [Report Bugs](https://github.com/your-username/shipstream/issues)
- 💡 [Request Features](https://github.com/your-username/shipstream/discussions)
- 📚 [Documentation](./server) (See individual service READMEs)

---

<div align="center">
  <strong>Built with ❤️ using 100% free-tier services</strong>
  <br><br>
  <a href="https://ship-stream.vercel.app/">Try Demo</a> • 
  <a href="#-quick-start">Get Started</a>
  <br><br>
  ⭐ <strong>Star this repo if you find it useful!</strong>
</div>