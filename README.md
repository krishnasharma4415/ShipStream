# 🚢 ShipStream

> **Deploy any GitHub repository in seconds** — A production-grade, microservices-based deployment platform with real-time build processing and instant static site hosting.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🎯 What is ShipStream?

**ShipStream** is a full-stack deployment platform that enables developers to deploy GitHub repositories instantly — similar to Vercel/Netlify, but built from scratch with modern microservices architecture. Users authenticate via GitHub OAuth, paste a repository URL, and get a live deployment with automated builds and subdomain-based hosting.

### ✨ Key Highlights

- 🏗️ **Microservices Architecture** — 4 independent services working in harmony
- 🔐 **Enterprise Security** — GitHub OAuth, JWT authentication, rate limiting, CORS protection
- ☁️ **Cloud-Native** — Cloudflare R2 storage, Redis queue management, Docker/Render deployment
- ⚡ **Real-Time Processing** — Asynchronous build queue with live status updates
- 🎨 **Modern Frontend** — React + TypeScript + Vite + TailwindCSS with dark mode
- 📦 **Production-Ready** — Health monitoring, error handling, comprehensive logging

---

## 🛠️ Tech Stack

### Frontend
```
React 18 • TypeScript • Vite • TailwindCSS • Radix UI • Axios • React Router v6
```

### Backend
```
Node.js • Express.js • TypeScript • GitHub OAuth • JWT • Redis • Cloudflare R2
```

### DevOps
```
Docker • Docker Compose • Render.com • Environment Validation • Health Checks
```

---

## 🏗️ Architecture

```mermaid
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend  │─────▶│ Auth Service │─────▶│    GitHub    │
│  (React SPA)│      │  (Port 5501) │      │    OAuth     │
└─────────────┘      └──────────────┘      └──────────────┘
       │                     │
       │                     ▼
       │             ┌───────────────┐      ┌──────────────┐
       └────────────▶│Upload Service │─────▶│ Cloudflare R2│
                     │  (Port 5500)  │      │   Storage    │
                     └───────────────┘      └──────────────┘
                             │                      ▲
                             ▼                      │
                     ┌───────────────┐              │
                     │ Redis Queue   │              │
                     └───────────────┘              │
                             │                      │
                             ▼                      │
                     ┌───────────────┐              │
                     │Deploy Service │──────────────┘
                     │  (Port 5502)  │
                     └───────────────┘
                             │
                             ▼
                     ┌────────────────┐
                     │Request Handler │
                     │  (Port 3000)   │
                     │ Serves Deployed│
                     │     Sites      │
                     └────────────────┘
```

**4 Microservices:**
1. **Auth Service** — GitHub OAuth authentication & JWT token management
2. **Upload Service** — Repository cloning, file upload, deployment tracking
3. **Deploy Service** — Build queue processing & project compilation
4. **Request Handler** — Static site serving with subdomain routing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ | GitHub OAuth App | Cloudflare R2 | Upstash Redis

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd shipstream

# Setup environment
cp server/.env.example server/.env
# Add your credentials (GitHub OAuth, R2, Redis)

# Validate configuration
node scripts/validate-env.js

# Start all services
./scripts/start-all.sh    # Linux/Mac
scripts\start-all.bat     # Windows

# Start frontend
cd client && npm install && npm run dev
```

**Services will be available at:**
- Frontend: `http://localhost:5173`
- Auth: `http://localhost:5501`
- Upload: `http://localhost:5500`
- Deploy: `http://localhost:5502`
- Request Handler: `http://localhost:3000`

---

## 📦 Deployment

### Option 1: Render.com (One-Click)
```bash
# Push to GitHub, then import to Render
# render.yaml auto-configures all 4 services
```

### Option 2: Docker Compose
```bash
docker-compose up -d  # Starts all services
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

---

## 🔑 Core Features

### 🔐 Authentication & Authorization
- GitHub OAuth 2.0 integration
- JWT-based session management
- Secure token refresh mechanism
- User-specific deployment isolation

### 📤 Deployment Pipeline
- GitHub repository cloning with branch support
- Automatic file upload to cloud storage
- Asynchronous build queue processing
- Real-time status updates (uploading → building → deployed)

### 🌐 Static Site Hosting
- Subdomain-based routing (`deployment-id.yourdomain.com`)
- Automatic MIME type detection
- SPA routing support
- Custom 404 pages

### 🔒 Security Features
- Rate limiting (5 req/15min on auth endpoints)
- Helmet.js security headers
- CORS protection with origin whitelisting
- Input validation & sanitization
- Encrypted secrets management

---

## 📂 Project Structure

```
shipstream/
├── client/                  # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/      # UI components + pages
│   │   ├── contexts/        # Auth state management
│   │   ├── services/        # API layer
│   │   └── hooks/           # Custom React hooks
│   └── package.json
│
├── server/
│   ├── auth-service/        # GitHub OAuth + JWT
│   ├── upload-service/      # Deployment management
│   ├── deploy-service/      # Build processing
│   ├── request-handler/     # Static file serving
│   └── shared/              # Common utilities
│
├── scripts/
│   ├── validate-env.js      # Environment validation
│   └── start-all.sh         # Service orchestration
│
├── docker-compose.yml       # Container orchestration
├── render.yaml              # Cloud deployment config
└── DEPLOYMENT.md            # Production guide
```

---

## 🧪 Testing

```bash
# Run tests for all services
cd server/auth-service && npm test
cd server/upload-service && npm test
cd server/deploy-service && npm test
```

---

## 🎨 UI/UX

- **Responsive Design** — Mobile-first approach with TailwindCSS
- **Dark Mode** — Automatic theme switching
- **Real-Time Updates** — Live deployment status tracking
- **Pirate Theme** — Playful nautical metaphors ("Set Sail", "Anchored")
- **Accessibility** — Radix UI primitives for WCAG compliance

---

## 📊 Technical Highlights for Recruiters

✅ **Full-Stack Proficiency** — React frontend, Node.js microservices, DevOps setup  
✅ **System Design** — Microservices, queue management, distributed architecture  
✅ **Cloud Technologies** — Cloudflare R2, Redis, Docker, Render.com  
✅ **Security Best Practices** — OAuth, JWT, rate limiting, input validation  
✅ **Modern Development** — TypeScript, async/await, ES6+, REST APIs  
✅ **Production-Ready** — Health checks, error handling, logging, monitoring  
✅ **Documentation** — Comprehensive guides, inline comments, API documentation  
✅ **DevOps** — Docker, environment validation, automated deployment scripts  

---

## 🔗 Resources

- 📖 [Deployment Guide](./DEPLOYMENT.md) — Production deployment instructions
- ✅ [Production Checklist](./PRODUCTION_CHECKLIST.md) — Pre-deployment verification
- 📋 [Project Analysis](./PROJECT_ANALYSIS.md) — Comprehensive technical breakdown

---

## 🌟 What Makes This Project Stand Out?

1. **Real-World Application** — Solves actual deployment challenges, not a tutorial project
2. **Scalable Architecture** — Designed for growth with horizontal scaling capability
3. **Enterprise Patterns** — Microservices, queue processing, cloud storage
4. **Security-First** — Multiple layers of protection (OAuth, JWT, rate limiting)
5. **DevOps Integration** — CI/CD ready with Docker and cloud deployment configs
6. **Production Quality** — Comprehensive error handling and monitoring

---

## 📈 Future Enhancements

- [ ] Custom domain support (DNS integration)
- [ ] Build caching for faster deployments
- [ ] Deployment rollback functionality
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] WebSocket for real-time updates

---

## 👨‍💻 Author

**[Your Name]**  
Full-Stack Developer specializing in scalable microservices and modern web applications

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://linkedin.com/in/your-profile)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-brightgreen?style=flat&logo=google-chrome)](https://your-portfolio.com)
[![Email](https://img.shields.io/badge/Email-Contact-red?style=flat&logo=gmail)](mailto:your.email@example.com)

---

## 📄 License

MIT License — See [LICENSE](./LICENSE) for details

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Built with ❤️ using TypeScript, React, Node.js, and modern cloud technologies

</div>
