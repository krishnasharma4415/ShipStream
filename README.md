# ShipStream

A modern platform for deploying static websites with GitHub OAuth authentication, built with a microservices architecture.

## 🏗️ Architecture

ShipStream consists of 4 microservices:

- **Auth Service** (Port 5501) - GitHub OAuth authentication and JWT management
- **Upload Service** (Port 5500) - Project file uploads to Cloudflare R2
- **Deploy Service** (Port 5502) - Build queue processing and deployment
- **Request Handler** (Port 3000) - Serves deployed static sites

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- GitHub OAuth App credentials
- Cloudflare R2 bucket
- Upstash Redis instance

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd shipstream
   ```

2. **Configure environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your credentials
   ```

3. **Validate configuration**
   ```bash
   node scripts/validate-env.js
   ```

4. **Start all services**
   
   **Linux/Mac:**
   ```bash
   chmod +x scripts/start-all.sh
   ./scripts/start-all.sh
   ```
   
   **Windows:**
   ```bash
   scripts\start-all.bat
   ```

5. **Verify services are running**
   ```bash
   curl http://localhost:5501/health  # Auth
   curl http://localhost:5500/health  # Upload
   curl http://localhost:5502/health  # Deploy
   curl http://localhost:3000/health  # Request Handler
   ```

### Individual Service Development

Each service can be run independently:

```bash
cd server/<service-name>
npm install
npm run dev
```

## 📦 Deployment

### Deploy to Render (Recommended)

1. Push your code to GitHub
2. Import the repository in Render
3. Render will detect `render.yaml` and create all services
4. Configure environment variables in Render dashboard
5. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔧 Configuration

### Required Environment Variables

See [server/.env.example](./server/.env.example) for all required variables.

**Generate secure secrets:**
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Service-Specific Configuration

#### Auth Service
- GitHub OAuth credentials
- JWT and encryption keys
- Redis connection
- Frontend URL for CORS

#### Upload Service
- Auth service URL
- R2 storage credentials
- Redis connection

#### Deploy Service
- R2 storage credentials
- Redis connection

#### Request Handler
- R2 storage credentials

## 🧪 Testing

Run tests for all services:

```bash
# Auth Service
cd server/auth-service
npm test

# Upload Service
cd server/upload-service
npm test

# Deploy Service
cd server/deploy-service
npm test

# Request Handler
cd server/request-handler
npm test
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [API Documentation](./docs/API.md) - API endpoints and usage (if exists)

## 🏗️ Project Structure

```
shipstream/
├── server/
│   ├── auth-service/       # Authentication service
│   ├── upload-service/     # File upload service
│   ├── deploy-service/     # Build and deployment service
│   ├── request-handler/    # Static site serving
│   └── shared/             # Shared utilities
├── scripts/
│   ├── validate-env.js     # Environment validation
│   ├── start-all.sh        # Start all services (Unix)
│   └── start-all.bat       # Start all services (Windows)
├── docker-compose.yml      # Docker composition
├── render.yaml             # Render deployment config
└── DEPLOYMENT.md           # Deployment guide
```

## 🔐 Security

- All secrets stored in environment variables
- JWT-based authentication
- Rate limiting on sensitive endpoints
- CORS configured for specific origins
- Helmet.js security headers
- Input validation and sanitization

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Storage:** Cloudflare R2
- **Database:** Redis (Upstash)
- **Authentication:** GitHub OAuth + JWT
- **Testing:** Jest

## 📊 Monitoring

Each service exposes a `/health` endpoint for monitoring:

```bash
GET /health
Response: {
  "status": "healthy",
  "service": "<service-name>",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for configuration
- Open an issue for bugs or feature requests

## 🎯 Roadmap

- [ ] Add support for custom domains
- [ ] Implement build caching
- [ ] Add deployment rollback feature
- [ ] Support for environment variables in builds
- [ ] Analytics dashboard
- [ ] Team collaboration features

## 🙏 Acknowledgments

- Cloudflare R2 for storage
- Upstash for Redis
- GitHub for OAuth
- Render for hosting
