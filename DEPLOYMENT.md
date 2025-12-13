# ShipStream Deployment Guide

This guide covers deploying all ShipStream services to production.

## Architecture Overview

ShipStream consists of 4 microservices:
- **auth-service** (Port 5501) - Handles GitHub OAuth and JWT authentication
- **upload-service** (Port 5500) - Manages project uploads to R2 storage
- **deploy-service** (Port 5502) - Processes build queue and deploys projects
- **request-handler** (Port 3000) - Serves deployed static sites from R2

## Prerequisites

- Node.js 18+ installed
- GitHub OAuth App credentials
- Cloudflare R2 bucket
- Upstash Redis instance
- Deployment platform accounts (Render, Railway, or similar)

## Environment Variables

Each service needs specific environment variables. See the service-specific sections below.

### Shared Environment Variables

These are needed by multiple services:

```bash
# Security (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
JWT_SECRET=<base64-encoded-32-byte-secret>
ENCRYPTION_KEY=<base64-encoded-32-byte-key>

# Cloudflare R2
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=<your-bucket-name>

# Redis
REDIS_URL=rediss://default:<token>@<endpoint>.upstash.io:6379

# Node Environment
NODE_ENV=production
```

## Service Deployment

### 1. Auth Service

**Required Environment Variables:**
```bash
AUTH_SERVICE_PORT=5501
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>
GITHUB_REDIRECT_URI=https://<your-auth-domain>/auth/github/callback
JWT_SECRET=<shared-jwt-secret>
ENCRYPTION_KEY=<shared-encryption-key>
REDIS_URL=<upstash-redis-url>
FRONTEND_URL=https://<your-frontend-domain>
NODE_ENV=production
```

**Build Command:** `npm run build`
**Start Command:** `npm start`
**Health Check:** `GET /health`

**GitHub OAuth Setup:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL to: `https://<your-auth-domain>/auth/github/callback`
4. Copy Client ID and Client Secret to environment variables

### 2. Upload Service

**Required Environment Variables:**
```bash
UPLOAD_SERVICE_PORT=5500
AUTH_SERVICE_URL=https://<your-auth-domain>
JWT_SECRET=<shared-jwt-secret>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_ENDPOINT=<r2-endpoint>
R2_BUCKET_NAME=<r2-bucket>
REDIS_URL=<upstash-redis-url>
NODE_ENV=production
```

**Build Command:** `npm run build`
**Start Command:** `npm start`
**Health Check:** `GET /health`

### 3. Deploy Service

**Required Environment Variables:**
```bash
DEPLOY_SERVICE_PORT=5502
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_ENDPOINT=<r2-endpoint>
R2_BUCKET_NAME=<r2-bucket>
REDIS_URL=<upstash-redis-url>
NODE_ENV=production
```

**Build Command:** `npm run build`
**Start Command:** `npm start`
**Health Check:** `GET /health`

### 4. Request Handler

**Required Environment Variables:**
```bash
REQUEST_HANDLER_PORT=3000
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_ENDPOINT=<r2-endpoint>
R2_BUCKET_NAME=<r2-bucket>
NODE_ENV=production
```

**Build Command:** `npm run build`
**Start Command:** `npm start`
**Health Check:** `GET /health`

## Deployment Platforms

### Option 1: Render.com

1. Create a new Web Service for each microservice
2. Connect your GitHub repository
3. Set the root directory to the service folder (e.g., `server/auth-service`)
4. Configure environment variables in the Render dashboard
5. Set build and start commands as specified above

**Render.yaml Example:**
```yaml
services:
  - type: web
    name: shipstream-auth
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      # Add other env vars via dashboard
```

### Option 2: Railway.app

1. Create a new project
2. Add each service as a separate deployment
3. Configure environment variables
4. Railway will auto-detect Node.js and run npm install

### Option 3: Docker Deployment

Each service has a Dockerfile. Build and deploy using:

```bash
# Build
docker build -t shipstream-auth ./server/auth-service
docker build -t shipstream-upload ./server/upload-service
docker build -t shipstream-deploy ./server/deploy-service
docker build -t shipstream-handler ./server/request-handler

# Run
docker run -p 5501:5501 --env-file .env shipstream-auth
docker run -p 5500:5500 --env-file .env shipstream-upload
docker run -p 5502:5502 --env-file .env shipstream-deploy
docker run -p 3000:3000 --env-file .env shipstream-handler
```

## Post-Deployment Checklist

- [ ] All services return 200 on `/health` endpoint
- [ ] GitHub OAuth flow completes successfully
- [ ] File upload to R2 works
- [ ] Build queue processes deployments
- [ ] Static sites are served correctly
- [ ] CORS is configured for your frontend domain
- [ ] Redis connection is stable
- [ ] Environment variables are secured (not in code)
- [ ] SSL/TLS certificates are configured
- [ ] Rate limiting is enabled
- [ ] Monitoring and logging are set up

## Security Considerations

1. **Never commit `.env` files** - Use platform-specific secret management
2. **Rotate secrets regularly** - Especially JWT_SECRET and ENCRYPTION_KEY
3. **Use HTTPS only** - Enforce SSL/TLS for all services
4. **Enable rate limiting** - Already configured in auth and upload services
5. **Validate CORS origins** - Update allowed origins in production
6. **Monitor Redis usage** - Set up alerts for connection issues
7. **Review GitHub OAuth scopes** - Only request necessary permissions

## Monitoring

Set up monitoring for:
- Service uptime (health checks)
- Response times
- Error rates
- Redis connection status
- R2 storage usage
- Build queue length

## Troubleshooting

### Service won't start
- Check environment variables are set correctly
- Verify Redis connection string
- Check R2 credentials and endpoint
- Review service logs for specific errors

### OAuth fails
- Verify GitHub OAuth callback URL matches deployment
- Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- Ensure FRONTEND_URL is correct

### Builds not processing
- Check Redis connection in deploy-service
- Verify R2 access for downloading source files
- Check build queue: `redis-cli LLEN build-queue`

### Static sites not serving
- Verify R2 bucket permissions
- Check file paths in R2 (should be `dist/<deployment-id>/`)
- Test R2 connection with health endpoint

## Scaling Considerations

- **Auth Service**: Stateless, can scale horizontally
- **Upload Service**: Consider file size limits and timeouts
- **Deploy Service**: Single instance recommended (queue processing)
- **Request Handler**: Stateless, can scale horizontally with CDN

## Cost Optimization

- Use Cloudflare R2 (no egress fees)
- Upstash Redis free tier (10K commands/day)
- Deploy services on free tiers initially
- Add CDN for request-handler in production
