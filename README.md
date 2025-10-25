# Vercel-like Deployment Platform

> Microservices platform for automatic GitHub repository deployment with real-time tracking and subdomain routing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

## Features

⚡ Auto-deploy from GitHub URLs • 🌐 Subdomain routing • ☁️ S3 storage • 📦 Redis queue • 🎨 Modern React UI

## Architecture

```
React Frontend → Upload Service (5500) → Deploy Service
                       ↓                        ↓
                  Redis Queue              AWS S3 ← Request Handler (3000)
```

**Services:**
- **Frontend** (5173): User interface
- **Upload Service** (5500): Clone repos, upload to S3, queue builds
- **Deploy Service**: Process builds in background
- **Request Handler** (3000): Serve at `{id}.localhost:3000`

## Quick Start

### Prerequisites
- Node.js v16+, Git, Redis, AWS S3 bucket

### Setup

```bash
# 1. Clone and configure
git clone <repo-url> && cd <project>
cp server/.env.example server/.env
# Edit .env with AWS credentials

# 2. Start Redis
docker run -d -p 6379:6379 redis:alpine

# 3. Install & run (Windows)
cd server && start-services.bat && start-dev.bat

# OR manually (4 terminals)
cd server/upload-service && npm install && npm run build && npm start
cd server/deploy-service && npm install && npm run build && npm start
cd server/request-handler && npm install && npm run build && npm start
cd client && npm install && npm run dev
```

### Access
- Frontend: http://localhost:5173
- Deployments: http://{id}.localhost:3000

## Configuration

**.env file:**
```bash
ACCESSID=your_aws_access_key
ACCESSKEY=your_aws_secret_key
ENDPOINT=your_s3_endpoint
```

**S3 Structure:**
```
vercel/
├── output{id}/     # Source
└── dist/{id}/      # Built files
```

## API

**Deploy:**
```bash
POST /send-url
{"repoUrl": "https://github.com/user/repo.git"}
→ {"generated": "abc123", "files": [...]}
```

**Status:**
```bash
GET /status?id=abc123
→ {"status": "uploaded|building|deployed|failed"}
```

## Testing

```bash
# Deploy test repo
curl -X POST http://localhost:5500/send-url \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/vercel/next.js/tree/canary/examples/hello-world"}'

# Check queue
redis-cli LLEN build-queue
```

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui  
**Backend:** Node.js, Express, TypeScript, Redis, AWS SDK, simple-git

## Troubleshooting

**Redis connection failed:**
```bash
redis-cli ping  # Should return PONG
docker run -d -p 6379:6379 redis:alpine
```

**Port in use:**
```bash
lsof -i :5500  # macOS/Linux
netstat -ano | findstr :5500  # Windows
```

**S3 access denied:** Verify `.env` credentials and bucket permissions (s3:PutObject, s3:GetObject)

## Production

- Use IAM roles instead of access keys
- Set up Redis cluster (AWS ElastiCache)
- Configure reverse proxy for subdomain routing
- Use PM2 for process management
- Enable HTTPS and rate limiting
- Add authentication middleware

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## Roadmap

Authentication • Custom domains • Build caching • Webhooks • Multi-region • Build logs UI

## License

ISC License

---

**Need help?** Open an issue or check [documentation](link).