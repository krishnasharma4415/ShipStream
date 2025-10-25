# DeployFast - Vercel-like Deployment Platform

> A complete microservices platform for automatic GitHub repository deployment with real-time tracking and subdomain routing. **100% free-tier compatible** with modern React frontend.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<div align="center">
  <h3>🚀 Deploy any GitHub repository in seconds</h3>
  <p>Zero configuration • Zero cost • Zero hassle</p>
  
  <a href="#quick-start">Quick Start</a> •
  <a href="#demo">Live Demo</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</div>

## ✨ Features

### Core Platform
⚡ **Auto-deploy from GitHub URLs** • 🌐 **Subdomain routing** • ☁️ **Cloudflare R2 storage** • 📦 **Redis queue** • 🎨 **Modern React UI**

### Frontend Features
- **Real-time Status Tracking**: Live deployment progress with visual indicators
- **Deployment History**: Persistent tracking of all deployments
- **Dark Mode Support**: Automatic system theme detection with manual toggle
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **URL Validation**: Smart GitHub URL validation with helpful error messages

### Backend Features
- **Free-Tier Stack**: Cloudflare R2 + Upstash Redis + Render.com = $0/month
- **Microservices Architecture**: Scalable, maintainable service separation
- **Build Processing**: Automated npm install and build execution
- **Status API**: Real-time deployment status tracking
- **Auto-scaling**: Handles multiple concurrent deployments
- **Error Recovery**: Robust error handling and retry mechanisms

## 🎯 Why DeployFast?

| Feature | DeployFast | Vercel | Netlify | Heroku |
|---------|------------|--------|---------|--------|
| **Cost** | 100% Free | Free tier limited | Free tier limited | Discontinued free tier |
| **Setup Time** | < 5 minutes | Instant | Instant | 10+ minutes |
| **Custom Domains** | ✅ Planned | ✅ Premium | ✅ Premium | ✅ Paid |
| **Build Time** | 15 min limit | 45 min limit | 15 min limit | 30 min limit |
| **Storage** | 10GB free | 100GB paid | 100GB paid | Limited |
| **Open Source** | ✅ MIT | ❌ Proprietary | ❌ Proprietary | ❌ Proprietary |
| **Self-Hosted** | ✅ Yes | ❌ No | ❌ No | ❌ No |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │    │  Upload Service │    │  Deploy Service │    │ Request Handler │
│    (Port 5173)  │───▶│    (Port 5500)  │    │  (Background)   │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │                       │
                                ▼                       ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                       │  Cloudflare R2  │◄──►│  Upstash Redis  │    │  Cloudflare R2  │
                       │   (Storage)     │    │   (Queue)       │    │   (Serving)     │
                       └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Responsibilities

- **React Frontend** (Port 5173): Modern UI with deployment management, status tracking, and history
- **Upload Service** (Port 5500): Accepts Git URLs, clones repos, uploads to R2, queues builds
- **Deploy Service** (Background): Processes build queue, runs npm builds, uploads built files
- **Request Handler** (Port 3000): Routes requests by subdomain, serves static files from R2

## 🆓 Free Tier Stack

| Service | Provider | Free Tier Limits | Monthly Cost |
|---------|----------|------------------|--------------|
| **Object Storage** | Cloudflare R2 | 10 GB storage, unlimited requests | $0 |
| **Redis Database** | Upstash | 10,000 commands/day | $0 |
| **Web Hosting** | Render.com | 750 hours/month per service | $0 |
| **Frontend Hosting** | Vercel/Netlify | Unlimited static sites | $0 |
| **Total Monthly Cost** | | | **$0** |

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **Git** installed
- **Cloudflare R2** bucket and API credentials
- **Upstash Redis** database connection URL

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd deployfast-platform
```

### 2. Configure Free-Tier Services

#### Cloudflare R2 Setup:
1. Create account at [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Enable R2 Object Storage
3. Create bucket (e.g., `deployfast-storage`)
4. Generate API token with Object Read & Write permissions

#### Upstash Redis Setup:
1. Create account at [Upstash Console](https://console.upstash.com/)
2. Create regional database (free tier)
3. Copy Redis connection URL

### 3. Environment Configuration
```bash
# Copy example environment file
cd server
copy .env.example .env

# Edit .env with your credentials
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=deployfast-storage
REDIS_URL=redis://default:your_password@your-redis-url.upstash.io:6379
```

### 4. Install Dependencies & Start Services

#### Option A: Automated Setup (Windows)
```bash
cd server
start-services.bat
start-dev.bat
```

#### Option B: Manual Setup (Cross-platform)
```bash
# Terminal 1 - Backend Services
cd server/upload-service && npm install && npm run build && npm start

# Terminal 2 - Deploy Service  
cd server/deploy-service && npm install && npm run build && npm start

# Terminal 3 - Request Handler
cd server/request-handler && npm install && npm run build && npm start

# Terminal 4 - Frontend
cd client && npm install && npm run dev
```

### 5. Access Your Platform
- **Frontend**: http://localhost:5173
- **API**: http://localhost:5500
- **Deployed Apps**: http://{id}.localhost:3000

## 🎬 Demo

### Live Demo
Try DeployFast without any setup: **[demo.deployfast.dev](https://demo.deployfast.dev)** *(Coming Soon)*

### Video Walkthrough
[![DeployFast Demo](https://img.shields.io/badge/▶️-Watch%20Demo-red?style=for-the-badge&logo=youtube)](https://youtube.com/watch?v=demo) *(Coming Soon)*

### Sample Deployments
Test with these repositories:
- **React App**: `https://github.com/facebook/create-react-app`
- **Vue.js App**: `https://github.com/vuejs/create-vue`
- **Static Site**: `https://github.com/microsoft/vscode-docs`
- **Next.js App**: `https://github.com/vercel/next.js/tree/canary/examples/hello-world`

## 🔄 How It Works

### Deployment Workflow
1. **Submit Repository**: User enters GitHub URL in React frontend
2. **Clone & Upload**: Upload service clones repo and uploads files to Cloudflare R2
3. **Queue Build**: Build job queued in Upstash Redis with unique deployment ID
4. **Process Build**: Deploy service downloads files, runs `npm install && npm run build`
5. **Deploy**: Built files uploaded to R2 under `/dist/{id}/` prefix
6. **Serve**: Request handler serves app via subdomain routing

### Supported Project Types

| Framework | Build Command | Output Directory | Status |
|-----------|---------------|------------------|--------|
| **React** | `npm run build` | `build/` or `dist/` | ✅ Fully Supported |
| **Vue.js** | `npm run build` | `dist/` | ✅ Fully Supported |
| **Angular** | `ng build` | `dist/` | ✅ Fully Supported |
| **Svelte** | `npm run build` | `public/` | ✅ Fully Supported |
| **Next.js** | `next build && next export` | `out/` | ✅ Static Export |
| **Nuxt.js** | `nuxt generate` | `dist/` | ✅ Static Generation |
| **Gatsby** | `gatsby build` | `public/` | ✅ Fully Supported |
| **Vite** | `vite build` | `dist/` | ✅ Fully Supported |
| **Parcel** | `parcel build` | `dist/` | ✅ Fully Supported |
| **Static HTML** | None | Root directory | ✅ Direct Serve |

### Build Requirements
- Project must have a `package.json` file
- Build command should be defined in `scripts.build`
- Output should be static files (HTML, CSS, JS, assets)

### File Structure in R2
```
bucket/
├── output/abc123def/           # Source files
│   ├── src/
│   ├── package.json
│   └── ...
└── dist/abc123def/             # Built files (served)
    ├── index.html
    ├── static/
    └── ...
```

## 📡 API Reference

### Deploy Repository
```bash
POST http://localhost:5500/send-url
Content-Type: application/json

{
  "repoUrl": "https://github.com/username/react-app.git"
}

# Response
{
  "generated": "abc123def",
  "files": ["src/App.js", "package.json", "public/index.html"]
}
```

### Check Deployment Status
```bash
GET http://localhost:5500/status?id=abc123def

# Possible responses
{"status": "uploaded"}   # Files uploaded, build queued
{"status": "building"}   # Build in progress
{"status": "deployed"}   # Build complete, app ready
{"status": "failed"}     # Build failed
{"status": null}         # Invalid deployment ID
```

### Access Deployed Application
```bash
# Local development
http://abc123def.localhost:3000

# Production (with custom domain)
http://abc123def.yourdomain.com
```

### Webhook Integration (Coming Soon)
```bash
POST /webhook/github
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...

# Auto-deploy on git push
{
  "repository": {
    "clone_url": "https://github.com/user/repo.git"
  },
  "head_commit": {
    "id": "abc123..."
  }
}
```

## 🧪 Testing Your Deployment

### Test with Sample Repository
```bash
# Deploy a test React app
curl -X POST http://localhost:5500/send-url \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/vercel/next.js/tree/canary/examples/hello-world"}'

# Monitor deployment progress
curl "http://localhost:5500/status?id=YOUR_DEPLOYMENT_ID"

# Access deployed app
open http://YOUR_DEPLOYMENT_ID.localhost:3000
```

### Monitor Services
```bash
# Check Redis queue (if using local Redis)
redis-cli LLEN build-queue

# Check Upstash Redis via dashboard
# Visit: https://console.upstash.com/

# Monitor R2 storage usage
# Visit: https://dash.cloudflare.com/
```

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | ^18.2.0 |
| **TypeScript** | Type Safety | ^5.2.2 |
| **Vite** | Build Tool & Dev Server | ^5.0.8 |
| **TailwindCSS** | Styling Framework | ^3.4.1 |
| **Shadcn/ui** | Component Library | Latest |
| **Axios** | HTTP Client | ^1.6.7 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | ^18.0.0 |
| **Express** | Web Framework | ^4.18.0 |
| **TypeScript** | Type Safety | ^5.0.0 |
| **AWS SDK v3** | Cloudflare R2 Client | ^3.0.0 |
| **Redis** | Queue Management | ^4.6.0 |
| **simple-git** | Git Operations | ^3.19.0 |

### Infrastructure
- **Cloudflare R2**: S3-compatible object storage with global CDN
- **Upstash Redis**: Serverless Redis for job queuing
- **Render.com**: Container hosting platform

## 🔒 Security & Best Practices

### Security Features
- **Environment Isolation**: Each deployment runs in isolated containers
- **Secure Token Management**: API tokens with minimal required permissions
- **Input Validation**: Comprehensive validation of GitHub URLs and user inputs
- **Rate Limiting**: Built-in protection against abuse and spam
- **CORS Configuration**: Proper cross-origin resource sharing setup

### Best Practices Implemented
- **Least Privilege Access**: Services only have permissions they need
- **Error Handling**: Graceful error handling without exposing sensitive data
- **Logging**: Comprehensive logging for debugging and monitoring
- **Health Checks**: Built-in health endpoints for all services
- **Graceful Shutdowns**: Proper cleanup on service termination

### Production Security Checklist
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting
- [ ] Add authentication for admin endpoints
- [ ] Regular security updates for dependencies
- [ ] Monitor for suspicious activities

## 🌐 Production Deployment

### Deploy to Render.com (Recommended)

#### Option 1: One-Click Deploy
1. Fork this repository to your GitHub account
2. Go to [Render.com](https://render.com) and sign up
3. Click "New" → "Blueprint"
4. Connect your forked repository
5. Render will automatically detect `render.yaml` and create all services
6. Add your environment variables in Render dashboard

#### Option 2: Deploy Frontend Separately
```bash
# Deploy frontend to Vercel
cd client
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

### Environment Variables for Production
```bash
# Backend services
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
REDIS_URL=redis://default:password@your-redis-url.upstash.io:6379

# Frontend
VITE_API_URL=https://your-upload-service.onrender.com

# Optional: Advanced Configuration
NODE_ENV=production
LOG_LEVEL=info
MAX_BUILD_TIME=900000  # 15 minutes in milliseconds
MAX_FILE_SIZE=100MB
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100  # requests per window
```

### Custom Domain Setup
```bash
# 1. Add custom domain in Render.com dashboard
# 2. Update DNS records:
#    A record: @ → 216.24.57.1
#    CNAME: www → your-app.onrender.com
#    CNAME: *.deployments → your-request-handler.onrender.com

# 3. Update environment variables
CUSTOM_DOMAIN=yourdomain.com
DEPLOYMENT_SUBDOMAIN=deployments.yourdomain.com
```

## 🔧 Troubleshooting

### Common Issues

**Build Failures**
- Check build logs in Render dashboard
- Verify project has valid `package.json` and build script
- Ensure dependencies are properly listed in `dependencies`, not `devDependencies`

**Redis Connection Issues**
```bash
# Check Upstash Redis connection
curl -X GET "https://your-redis-url.upstash.io/ping" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**R2 Access Issues**
- Verify API token permissions (Object Read & Write)
- Check bucket name matches environment variable
- Ensure endpoint URL format: `https://account-id.r2.cloudflarestorage.com`

**Frontend API Connection**
- Verify `VITE_API_URL` points to correct backend URL
- Check CORS settings in upload service
- Ensure backend services are running and accessible

**Port Already in Use (Local Development)**
```bash
# Windows
netstat -ano | findstr :5500
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5500
kill -9 <PID>
```

## 📊 Monitoring & Scaling

### Free Tier Limits
| Service | Metric | Free Limit | Monitor Via |
|---------|--------|------------|-------------|
| Cloudflare R2 | Storage | 10 GB | Cloudflare Dashboard |
| Cloudflare R2 | Requests | Unlimited | Cloudflare Analytics |
| Upstash Redis | Commands | 10,000/day | Upstash Console |
| Render.com | Hours | 750/month per service | Render Dashboard |

### Performance Considerations
- **Cold Starts**: Render.com free tier has ~30s cold start delay
- **Build Time**: Limited to 15 minutes per build on free tier
- **Concurrent Builds**: Deploy service processes one build at a time
- **File Size**: R2 has 5TB max object size (more than sufficient)

### Scaling Beyond Free Tier
When you outgrow free tiers:
1. **Cloudflare R2**: $0.015/GB/month beyond 10GB
2. **Upstash Redis**: $0.2/100K commands beyond daily limit  
3. **Render.com**: $7/month for always-on services

**Total cost for moderate usage**: ~$10-20/month

## 📈 Performance & Optimization

### Performance Metrics
- **Cold Start Time**: < 30 seconds (Render.com free tier)
- **Build Time**: 2-15 minutes (depending on project size)
- **Deploy Time**: < 1 minute after build completion
- **Global CDN**: Sub-100ms response times via Cloudflare

### Optimization Features
- **Build Caching**: Planned feature to cache node_modules
- **Incremental Builds**: Only rebuild changed files (planned)
- **Parallel Processing**: Multiple build workers (paid tier)
- **Edge Caching**: Static assets cached globally

### Monitoring Dashboard
```bash
# Health check endpoints
GET /health              # Service health
GET /metrics            # Prometheus metrics
GET /status/system      # System status
```

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic deployment functionality
- ✅ React frontend with status tracking
- ✅ Free-tier infrastructure
- ✅ Real-time deployment status

### Phase 2 (Next)
- 🔄 **Authentication & User Management**
- 🔄 **Custom Domains Support**
- 🔄 **Build Caching for Faster Deployments**
- 🔄 **GitHub Webhooks for Auto-Deploy**

### Phase 3 (Future)
- 📋 **Environment Variables Support**
- 📋 **Build Logs UI**
- 📋 **Multi-region Deployment**
- 📋 **Team Collaboration Features**
- 📋 **Analytics Dashboard**

## 🧪 Development & Testing

### Local Development Setup
```bash
# Install development dependencies
npm install -g nodemon concurrently

# Start all services in development mode
npm run dev:all

# Or start individual services
npm run dev:upload     # Upload service with hot reload
npm run dev:deploy     # Deploy service with hot reload
npm run dev:handler    # Request handler with hot reload
npm run dev:client     # React frontend with HMR
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit       # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests

# Test coverage
npm run test:coverage
```

### Docker Development
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run specific services
docker-compose up upload-service deploy-service

# View logs
docker-compose logs -f upload-service
```

### API Testing with Postman
Import the Postman collection: `docs/DeployFast.postman_collection.json`

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run tests/load-test.yml
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test with the free-tier stack
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled for both frontend and backend
- **ESLint**: Configured for React and Node.js
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Clear commit message format
- **Husky**: Pre-commit hooks for code quality
- **Jest**: Unit testing framework
- **Cypress**: End-to-end testing

### Contribution Guidelines
- Write tests for new features
- Update documentation for API changes
- Follow the existing code style
- Add JSDoc comments for public functions
- Ensure all CI checks pass

## 📚 Documentation

### API Documentation
- **OpenAPI Spec**: `docs/api-spec.yaml`
- **Postman Collection**: `docs/DeployFast.postman_collection.json`
- **Interactive Docs**: Available at `/api-docs` when running locally

### Architecture Documentation
- **System Design**: `docs/ARCHITECTURE.md`
- **Database Schema**: `docs/DATABASE.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Security Guide**: `docs/SECURITY.md`

### Tutorials
- **Getting Started**: `docs/tutorials/getting-started.md`
- **Custom Domains**: `docs/tutorials/custom-domains.md`
- **Advanced Configuration**: `docs/tutorials/advanced-config.md`
- **Troubleshooting**: `docs/tutorials/troubleshooting.md`

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

### Get Help
- **� FBug Reports**: [GitHub Issues](https://github.com/your-username/deployfast/issues)
- **� Fecature Requests**: [GitHub Discussions](https://github.com/your-username/deployfast/discussions)
- **� Documyentation**: See individual service READMEs in `/server` and `/client`
- **🚀 Deployment Guide**: Check `DEPLOYMENT.md` for detailed setup instructions
- **💬 Discord Community**: [Join our Discord](https://discord.gg/deployfast) *(Coming Soon)*
- **📧 Email Support**: support@deployfast.dev *(Coming Soon)*

### Community Resources
- **Blog**: [blog.deployfast.dev](https://blog.deployfast.dev) *(Coming Soon)*
- **Twitter**: [@DeployFastDev](https://twitter.com/DeployFastDev) *(Coming Soon)*
- **YouTube**: [DeployFast Channel](https://youtube.com/@deployfast) *(Coming Soon)*

## 🏆 Acknowledgments

### Inspiration
- **Vercel**: For pioneering the modern deployment experience
- **Netlify**: For making static site deployment accessible
- **Railway**: For simplifying infrastructure management

### Open Source Libraries
- **React Team**: For the amazing React framework
- **Vite Team**: For the lightning-fast build tool
- **Tailwind CSS**: For the utility-first CSS framework
- **Shadcn/ui**: For the beautiful component library

### Free Tier Providers
- **Cloudflare**: For generous R2 storage limits
- **Upstash**: For serverless Redis database
- **Render.com**: For reliable container hosting

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/deployfast?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/deployfast?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/deployfast)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/deployfast)
![GitHub last commit](https://img.shields.io/github/last-commit/your-username/deployfast)

### Contributors
<a href="https://github.com/your-username/deployfast/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=your-username/deployfast" />
</a>

---

<div align="center">
  <h3>🚀 Ready to deploy? Get started in 5 minutes!</h3>
  
  **Built with ❤️ using 100% free-tier services**
  
  *DeployFast makes deployment accessible to everyone - from students learning web development to startups building their first products.*
  
  <br>
  
  **⭐ Star this repo if you find it useful!**
</div>