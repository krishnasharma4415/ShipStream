# 🚀 ShipStream

A production-ready, Vercel-like deployment platform that enables instant deployment of static websites with GitHub OAuth authentication, automated builds, and live hosting.

## ✨ Features

### Core Functionality
- **🔐 GitHub OAuth Authentication**: Secure user authentication with GitHub accounts
- **📦 Repository Deployment**: Deploy any public GitHub repository with a single click
- **👤 User Dashboard**: Comprehensive dashboard to manage all deployments
- **⚡ Real-time Status Tracking**: Live deployment progress monitoring
- **🌐 Unique Subdomains**: Each deployment gets its own subdomain
- **🔄 Deployment Management**: View, redeploy, and delete deployments
- **🛡️ Rate Limiting**: Built-in protection against abuse and spam

### Security & Performance
- JWT-based authentication with secure token management
- AES-256 encryption for sensitive data
- Redis-backed session management
- Rate limiting on all critical endpoints
- Input validation and sanitization
- CORS protection with configurable origins

## 🏗️ Architecture

ShipStream follows a microservices architecture with four independent backend services and a React frontend.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│                    Port 5173 / Vercel Deploy                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/REST API
                 │
    ┌────────────┼────────────┬────────────┬──────────────┐
    │            │            │            │              │
    ▼            ▼            ▼            ▼              ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  ┌──────────┐
│  Auth  │  │ Upload │  │ Deploy │  │ Request  │  │  GitHub  │
│Service │  │Service │  │Service │  │ Handler  │  │  OAuth   │
│ :5501  │  │ :5500  │  │ :5502  │  │  :3000   │  │   API    │
└───┬────┘  └───┬────┘  └───┬────┘  └────┬─────┘  └──────────┘
    │           │           │            │
    └───────────┼───────────┼────────────┘
                │           │
         ┌──────┴───────────┴──────┐
         │                          │
         ▼                          ▼
    ┌─────────┐              ┌──────────┐
    │  Redis  │              │    R2    │
    │ (Queue) │              │(Storage) │
    │ Upstash │              │Cloudflare│
    └─────────┘              └──────────┘
```

### Service Details

#### 1. **Authentication Service** (Port 5501)
**Purpose**: Handles user authentication and session management

**Key Features**:
- GitHub OAuth 2.0 integration
- JWT token generation and validation
- Session management with Redis
- User profile management
- Token refresh mechanism

**Endpoints**:
- `POST /auth/github/login` - Initiate OAuth flow
- `GET /auth/github/callback` - Handle OAuth callback
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout and invalidate session

**Tech Stack**: Express, TypeScript, jsonwebtoken, axios, Redis

#### 2. **Upload Service** (Port 5500)
**Purpose**: Manages repository cloning and deployment creation

**Key Features**:
- Git repository cloning with branch support
- File upload to Cloudflare R2
- Deployment record creation
- Queue management for build jobs
- Deployment CRUD operations

**Endpoints**:
- `POST /send-url` - Create new deployment
- `GET /status?id=<id>` - Check deployment status
- `GET /deployments` - List user deployments
- `GET /deployments/:id` - Get deployment details
- `DELETE /deployments/:id` - Delete deployment
- `POST /deployments/:id/redeploy` - Trigger redeployment

**Tech Stack**: Express, TypeScript, simple-git, AWS SDK (S3), Redis

#### 3. **Deploy Service** (Port 5502)
**Purpose**: Processes build queue and compiles projects

**Key Features**:
- Background job processing with Redis queue
- Automatic framework detection
- Build execution (npm install & build)
- Built assets upload to R2
- Build status tracking

**Endpoints**:
- `POST /deploy` - Trigger queue processing
- `GET /health` - Health check

**Build Process**:
1. Pull deployment ID from Redis queue
2. Download source code from R2
3. Detect framework and build command
4. Execute build process
5. Upload built assets to R2
6. Update deployment status

**Tech Stack**: Express, TypeScript, child_process, AWS SDK (S3), Redis

#### 4. **Request Handler** (Port 3000)
**Purpose**: Serves deployed static websites

**Key Features**:
- Dynamic subdomain routing
- Static file serving from R2
- Automatic index.html fallback
- Content-Type detection
- 404 handling

**Tech Stack**: Express, TypeScript, AWS SDK (S3)

#### 5. **Frontend** (Port 5173)
**Purpose**: User interface for the platform

**Key Features**:
- Modern React 18 with TypeScript
- Responsive UI with Tailwind CSS
- Component library with Shadcn/ui
- GitHub OAuth integration
- Real-time deployment status
- Deployment management dashboard

**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui, React Router

### Infrastructure Components

#### **Cloudflare R2**
- **Purpose**: Object storage for source code and built assets
- **Free Tier**: 10GB storage, 1M Class A operations/month
- **Usage**: 
  - Source code storage: `output/<deployment-id>/`
  - Built assets: `dist/<deployment-id>/`

#### **Upstash Redis**
- **Purpose**: Queue management and session storage
- **Free Tier**: 10,000 commands/day
- **Usage**:
  - Build queue: `build-queue` (list)
  - Deployment status: `status` (hash)
  - User sessions: `session:<sessionId>` (string)
  - OAuth states: `oauth:state:<state>` (string)

#### **GitHub OAuth**
- **Purpose**: User authentication
- **Scopes**: `user:email`, `read:user`
- **Flow**: Authorization Code Grant

#### **Render.com**
- **Purpose**: Backend service hosting
- **Free Tier**: 750 hours/month per service
- **Services**: 4 web services (auth, upload, deploy, request-handler)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** installed
- **GitHub account** for OAuth setup
- **Cloudflare account** for R2 storage
- **Upstash account** for Redis

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/shipstream.git
cd shipstream
```

2. **Set up environment variables**
```bash
# Copy example files
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# Edit server/.env and client/.env.local with your credentials
```

3. **Install dependencies**
```bash
# Install backend service dependencies
cd server/auth-service && npm install
cd ../upload-service && npm install
cd ../deploy-service && npm install
cd ../request-handler && npm install

# Install frontend dependencies
cd ../../client && npm install
```

4. **Build services**
```bash
cd server/auth-service && npm run build
cd ../upload-service && npm run build
cd ../deploy-service && npm run build
cd ../request-handler && npm run build
```

5. **Start the application**
```bash
# Terminal 1 - Start all backend services
cd server && npm start

# Terminal 2 - Start frontend
cd client && npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Auth API: http://localhost:5501
- Upload API: http://localhost:5500
- Deploy API: http://localhost:5502
- Request Handler: http://localhost:3000

### Environment Configuration

#### Server Environment (`server/.env`)
```env
# Service Ports
AUTH_SERVICE_PORT=5501
UPLOAD_SERVICE_PORT=5500
DEPLOY_SERVICE_PORT=5502
REQUEST_HANDLER_PORT=3000

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5501/auth/github/callback

# Security Keys
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Service URLs
AUTH_SERVICE_URL=http://localhost:5501
UPLOAD_SERVICE_URL=http://localhost:5500
DEPLOY_SERVICE_URL=http://localhost:5502
FRONTEND_URL=http://localhost:5173

# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_aws_access_key
R2_SECRET_ACCESS_KEY=your_aws_secret_key
R2_ENDPOINT=your_r2_endpoint
R2_BUCKET_NAME=your_r2_bucket_name

# Upstash Redis Configuration
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

**Frontend** (`client/.env.local`):
```env
VITE_AUTH_SERVICE_URL=http://localhost:5501
VITE_UPLOAD_SERVICE_URL=http://localhost:5500
```

**Generate secure keys**:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Client Environment (`client/.env.local`)
```env
VITE_AUTH_SERVICE_URL=http://localhost:5501
VITE_UPLOAD_SERVICE_URL=http://localhost:5500
```

### External Services Setup

#### 1. GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: ShipStream (or your preferred name)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5501/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**
6. Add these to your `server/.env` file

#### 2. Cloudflare R2 Storage

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **R2 Object Storage**
3. Click "Create bucket"
4. Name your bucket (e.g., `shipstream`)
5. Go to **Manage R2 API Tokens**
6. Create a new API token with:
   - **Permissions**: Object Read & Write
   - **Bucket**: Your bucket name
7. Copy the **Access Key ID**, **Secret Access Key**, and **Endpoint URL**
8. Add these to your `server/.env` file

#### 3. Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose a region close to your deployment
4. Copy the **Redis URL** (starts with `rediss://`)
5. Add this to your `server/.env` file

### Development Workflow

#### Starting Services

**Option 1: All services at once (Recommended)**
```bash
# Terminal 1 - Backend services
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

**Option 2: Individual services**
```bash
# Terminal 1 - Auth Service
cd server/auth-service && npm run dev

# Terminal 2 - Upload Service
cd server/upload-service && npm run dev

# Terminal 3 - Deploy Service
cd server/deploy-service && npm run dev

# Terminal 4 - Request Handler
cd server/request-handler && npm run dev

# Terminal 5 - Frontend
cd client && npm run dev
```

#### Testing the Application

1. **Test Authentication**:
   - Visit http://localhost:5173
   - Click "Sign in with GitHub"
   - Authorize the application
   - Verify you're redirected back and logged in

2. **Test Deployment**:
   - Enter a GitHub repository URL (e.g., `https://github.com/username/repo`)
   - Select branch (default: main)
   - Click "Deploy"
   - Monitor deployment status
   - Access deployed site via provided subdomain

3. **Test Management**:
   - View all deployments in dashboard
   - Click on a deployment to see details
   - Test redeploy functionality
   - Test delete functionality

## 📚 API Documentation

### Authentication Service (Port 5501)

#### `POST /auth/github/login`
Initiates GitHub OAuth flow
```json
Response: {
  "authUrl": "https://github.com/login/oauth/authorize?...",
  "state": "random-state-string"
}
```

#### `GET /auth/github/callback`
Handles OAuth callback and redirects to frontend with JWT token
```
Query Params: code, state
Redirects to: {FRONTEND_URL}/auth/callback?token={jwt}&sessionId={sessionId}
```

#### `GET /auth/me`
Get current user information (requires authentication)
```json
Headers: { "Authorization": "Bearer {jwt}" }
Response: {
  "id": "user-id",
  "githubId": "123456",
  "username": "johndoe",
  "email": "john@example.com",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z"
}
```

#### `POST /auth/refresh`
Refresh JWT token
```json
Request: { "token": "old-jwt-token" }
Response: { "token": "new-jwt-token", "expiresIn": "24h" }
```

#### `POST /auth/logout`
Logout and invalidate session
```json
Request: { "sessionId": "session-id" }
Response: { "message": "Logged out successfully" }
```

### Upload Service (Port 5500)

#### `POST /send-url`
Create new deployment (requires authentication)
```json
Headers: { "Authorization": "Bearer {jwt}" }
Request: {
  "repoUrl": "https://github.com/username/repo",
  "branch": "main"
}
Response: {
  "id": "deployment-id",
  "subdomain": "unique-subdomain",
  "status": "uploaded",
  "repoName": "repo",
  "branch": "main",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /status?id={deploymentId}`
Check deployment status
```json
Response: { "status": "uploaded" | "building" | "deployed" | "failed" }
```

#### `GET /deployments`
List user deployments (requires authentication)
```json
Headers: { "Authorization": "Bearer {jwt}" }
Response: {
  "deployments": [...],
  "total": 5
}
```

#### `GET /deployments/:id`
Get deployment details (requires authentication & ownership)
```json
Headers: { "Authorization": "Bearer {jwt}" }
Response: {
  "id": "deployment-id",
  "userId": "user-id",
  "repoUrl": "https://github.com/username/repo",
  "repoName": "repo",
  "branch": "main",
  "subdomain": "unique-subdomain",
  "status": "deployed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### `DELETE /deployments/:id`
Delete deployment (requires authentication & ownership)
```json
Headers: { "Authorization": "Bearer {jwt}" }
Response: {
  "message": "Deployment deleted successfully",
  "id": "deployment-id"
}
```

#### `POST /deployments/:id/redeploy`
Trigger redeployment (requires authentication & ownership)
```json
Headers: { "Authorization": "Bearer {jwt}" }
Response: {
  "message": "Redeployment triggered successfully",
  "id": "deployment-id",
  "status": "uploaded"
}
```

### Deploy Service (Port 5502)

#### `POST /deploy`
Trigger queue processing (internal use)
```json
Response: {
  "success": true,
  "message": "Queue processed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Request Handler (Port 3000)

#### `GET /{subdomain}/*`
Serves deployed static files
- Automatically serves index.html for directories
- Returns 404 for missing files
- Sets appropriate Content-Type headers

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with 24-hour expiration
- **Secure session management** with Redis
- **OAuth state validation** to prevent CSRF attacks
- **Token refresh mechanism** for seamless user experience

### Data Protection
- **AES-256 encryption** for sensitive data
- **Secure password hashing** (if applicable)
- **Environment variable protection** (.env files not committed)

### API Security
- **Rate limiting** on authentication and deployment endpoints
- **Input validation** on all endpoints
- **CORS protection** with configurable origins
- **Ownership verification** for deployment operations

### Infrastructure Security
- **TLS/SSL** for all external communications
- **Redis TLS** (rediss://) for secure queue operations
- **Signed URLs** for R2 object access (if needed)

## 🧪 Testing

### Run Tests
```bash
# Auth service tests
cd server/auth-service && npm test

# Upload service tests
cd server/upload-service && npm test

# Deploy service tests
cd server/deploy-service && npm test

# Request handler tests
cd server/request-handler && npm test
```

### Manual Testing Checklist
- [ ] GitHub OAuth flow works
- [ ] User can deploy a repository
- [ ] Deployment status updates correctly
- [ ] Built site is accessible via subdomain
- [ ] User can view all deployments
- [ ] User can redeploy existing deployment
- [ ] User can delete deployment
- [ ] Rate limiting works
- [ ] Authentication persists across page refreshes

## 🚀 Production Deployment

### Quick Deploy

The application is configured for easy deployment using the included `render.yaml` file.

1. **Fork this repository** to your GitHub account
2. **Set up external services** (GitHub OAuth, Cloudflare R2, Upstash Redis)
3. **Deploy to Render.com**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your forked repository
   - Render will automatically create all 4 services
4. **Set environment variables** in Render dashboard for each service
5. **Deploy frontend to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your repository
   - Set root directory to `client`
   - Add environment variables
   - Deploy

For detailed deployment instructions, see [DEPLOY.md](DEPLOY.md)

### Environment Variables for Production

See `.env.production.example` for a complete list of required environment variables for production deployment.

## 🛠️ Supported Frameworks

ShipStream automatically detects and builds projects using the following frameworks:

| Framework | Build Command | Output Directory | Status |
|-----------|---------------|------------------|--------|
| **React** | `npm run build` | `build/` or `dist/` | ✅ Fully Supported |
| **Vue.js** | `npm run build` | `dist/` | ✅ Fully Supported |
| **Next.js** | `next build && next export` | `out/` | ✅ Static Export Only |
| **Vite** | `vite build` | `dist/` | ✅ Fully Supported |
| **Angular** | `ng build` | `dist/` | ✅ Fully Supported |
| **Svelte** | `npm run build` | `public/` or `build/` | ✅ Fully Supported |
| **SvelteKit** | `npm run build` | `build/` | ✅ Static Adapter Only |
| **Gatsby** | `gatsby build` | `public/` | ✅ Fully Supported |
| **Nuxt.js** | `nuxt generate` | `dist/` | ✅ Static Generation Only |
| **Astro** | `astro build` | `dist/` | ✅ Fully Supported |
| **Docusaurus** | `npm run build` | `build/` | ✅ Fully Supported |
| **Hugo** | `hugo` | `public/` | ✅ Fully Supported |

### Requirements
- Valid `package.json` with a `build` script
- Static output only (no server-side rendering)
- Build must complete within 10 minutes
- Output size should be under 500MB

### Build Process
1. Clone repository from GitHub
2. Detect framework from `package.json`
3. Run `npm install`
4. Execute `npm run build`
5. Upload built assets to R2
6. Make site available via subdomain

## 🔧 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js 18** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **simple-git** - Git operations
- **jsonwebtoken** - JWT authentication
- **Redis** - Queue and session management
- **AWS SDK (S3)** - R2 storage operations

### Infrastructure
- **Cloudflare R2** - Object storage (10GB free tier)
- **Upstash Redis** - Managed Redis (10k commands/day free)
- **Render.com** - Backend hosting (750 hours/month free)
- **Vercel** - Frontend hosting (unlimited free tier)
- **GitHub OAuth** - User authentication

### Development Tools
- **PM2** - Process manager for production
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Supertest** - API testing

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
**Windows:**
```bash
netstat -ano | findstr :5500
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -i :5500
kill -9 <PID>
```

#### Build Fails
- Verify `package.json` has a `build` script
- Check if dependencies install correctly
- Ensure Node.js version is 18+
- Test build locally: `npm install && npm run build`

#### Redis Connection Error
- Verify `REDIS_URL` format: `rediss://default:password@host:6379`
- Check Upstash dashboard for connection status
- Ensure Redis database is active

#### R2 Upload Fails
- Verify R2 credentials in `.env`
- Check bucket name matches Cloudflare dashboard
- Ensure API token has read/write permissions
- Verify endpoint URL is correct

#### Authentication Issues
- Check GitHub OAuth callback URL matches
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Ensure `JWT_SECRET` is set and consistent across services
- Check CORS settings allow frontend URL

#### Deployment Stuck
- Check Redis queue: `redis-cli LLEN build-queue`
- Verify deploy service is running
- Check deploy service logs for errors
- Manually trigger: `POST /deploy` to deploy service

#### Frontend Can't Connect to Backend
- Verify `VITE_AUTH_SERVICE_URL` and `VITE_UPLOAD_SERVICE_URL` in `.env.local`
- Check CORS settings on backend services
- Ensure all services are running
- Check browser console for errors

### Debug Mode

Enable debug logging:
```bash
# In server/.env
NODE_ENV=development
DEBUG=true
```

### Health Checks

Check if services are running:
```bash
curl http://localhost:5501/health  # Auth service
curl http://localhost:5500/health  # Upload service
curl http://localhost:5502/health  # Deploy service
curl http://localhost:3000/health  # Request handler
```

## 🗺️ Roadmap

### ✅ Current (v1.0)
- [x] GitHub OAuth authentication
- [x] Repository deployment
- [x] Automatic builds
- [x] Static file serving
- [x] Deployment management (CRUD)
- [x] Real-time status tracking
- [x] Rate limiting
- [x] User dashboard
- [x] Free-tier infrastructure

### 🔄 In Progress (v1.1)
- [ ] Custom domains support
- [ ] Build logs UI
- [ ] Build caching
- [ ] GitHub webhooks for auto-deploy
- [ ] Environment variables per deployment
- [ ] Deployment rollback

### 📋 Planned (v2.0)
- [ ] Team collaboration
- [ ] Deployment analytics
- [ ] Build performance metrics
- [ ] Multiple deployment environments
- [ ] Preview deployments for PRs
- [ ] Custom build commands
- [ ] Docker support
- [ ] Monorepo support
- [ ] Edge functions
- [ ] Database integration

### 🎯 Future Considerations
- [ ] Private repository support
- [ ] Paid plans with more resources
- [ ] CDN integration
- [ ] DDoS protection
- [ ] Advanced monitoring
- [ ] Slack/Discord notifications
- [ ] API access tokens
- [ ] Terraform/IaC support

## 📊 Project Structure

```
shipstream/
├── client/                          # Frontend application
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── pages/                  # Page components
│   │   ├── lib/                    # Utilities and helpers
│   │   ├── hooks/                  # Custom React hooks
│   │   └── App.tsx                 # Main app component
│   ├── public/                     # Static assets
│   ├── .env.example                # Environment template
│   ├── .env.local                  # Local environment (not committed)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                          # Backend services
│   ├── auth-service/               # Authentication service
│   │   ├── src/
│   │   │   ├── config/            # Configuration files
│   │   │   ├── middleware/        # Express middleware
│   │   │   ├── routes/            # API routes
│   │   │   ├── services/          # Business logic
│   │   │   ├── types/             # TypeScript types
│   │   │   ├── utils/             # Utility functions
│   │   │   └── index.ts           # Entry point
│   │   ├── dist/                  # Compiled JavaScript
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── upload-service/             # Upload & deployment service
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   ├── getAllfiles.ts     # File traversal
│   │   │   ├── upload.ts          # R2 upload logic
│   │   │   ├── redisClient.ts     # Redis connection
│   │   │   └── index.ts
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── deploy-service/             # Build processing service
│   │   ├── src/
│   │   │   ├── r2Storage.ts       # R2 operations
│   │   │   ├── execute.ts         # Build execution
│   │   │   ├── redisClient.ts
│   │   │   └── index.ts
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── request-handler/            # Static file server
│   │   ├── src/
│   │   │   ├── r2Storage.ts
│   │   │   └── index.ts
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                     # Shared utilities (if any)
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example                # Environment template
│   ├── start-services.js           # Service launcher
│   ├── ecosystem.config.js         # PM2 configuration
│   └── package.json
│
├── .env.production.example         # Production env template
├── .gitignore
├── render.yaml                     # Render.com deployment config
├── DEPLOY.md                       # Deployment guide
└── README.md                       # This file
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/shipstream.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Test thoroughly
6. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Development Guidelines
- **Code Style**: Follow existing patterns, use TypeScript strict mode
- **Linting**: Run `npm run lint` before committing
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline comments
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `docs:` - Documentation changes
  - `style:` - Code style changes (formatting, etc.)
  - `refactor:` - Code refactoring
  - `test:` - Adding or updating tests
  - `chore:` - Maintenance tasks

### Areas for Contribution
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🧪 Test coverage
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🔒 Security improvements

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## 📄 License

This project is licensed under the **ISC License**.

```
ISC License

Copyright (c) 2024 ShipStream

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## 🆘 Support & Community

### Get Help
- 📖 **Documentation**: Read this README and [DEPLOY.md](DEPLOY.md)
- 🐛 **Bug Reports**: [Open an issue](https://github.com/your-username/shipstream/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/your-username/shipstream/discussions)
- 💬 **Questions**: [GitHub Discussions](https://github.com/your-username/shipstream/discussions)

### Resources
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Render.com Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🌟 Acknowledgments

Built with amazing open-source technologies:
- [React](https://react.dev/) - UI library
- [Express](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Component library

Special thanks to all contributors and the open-source community!

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/shipstream?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/shipstream?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/shipstream)
![GitHub license](https://img.shields.io/github/license/your-username/shipstream)

---

<div align="center">
  <h3>🚀 Built with ❤️ using 100% free-tier services</h3>
  <p>
    <a href="https://ship-stream.vercel.app/">🌐 Live Demo</a> •
    <a href="#-getting-started">📚 Get Started</a> •
    <a href="DEPLOY.md">🚀 Deploy Guide</a>
  </p>
  <p>
    <strong>⭐ Star this repo if you find it useful!</strong>
  </p>
  <p>
    <sub>Made by developers, for developers</sub>
  </p>
</div>