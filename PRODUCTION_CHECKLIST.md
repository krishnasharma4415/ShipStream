# Production Deployment Checklist

Use this checklist to ensure your ShipStream deployment is production-ready.

## Pre-Deployment

### 1. Environment Setup
- [ ] Generate secure JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] Generate secure ENCRYPTION_KEY: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] Create GitHub OAuth App and get credentials
- [ ] Set up Cloudflare R2 bucket
- [ ] Create Upstash Redis instance
- [ ] Document all environment variables

### 2. GitHub OAuth Configuration
- [ ] Create GitHub OAuth App at https://github.com/settings/developers
- [ ] Set Homepage URL to your frontend domain
- [ ] Set Authorization callback URL to: `https://<auth-domain>/auth/github/callback`
- [ ] Copy Client ID and Client Secret
- [ ] Test OAuth flow in development

### 3. Cloudflare R2 Setup
- [ ] Create R2 bucket
- [ ] Generate API tokens with read/write permissions
- [ ] Configure CORS for your domains
- [ ] Test upload and download operations
- [ ] Set up lifecycle policies (optional)

### 4. Redis Setup
- [ ] Create Upstash Redis instance
- [ ] Copy connection string (rediss:// format)
- [ ] Test connection from local environment
- [ ] Configure eviction policy if needed

### 5. Code Review
- [ ] All services build without errors
- [ ] All tests pass
- [ ] No sensitive data in code
- [ ] Environment variables properly loaded
- [ ] Error handling implemented
- [ ] Logging configured

## Deployment Steps

### Option A: Deploy to Render (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy via Render Dashboard**
   - Go to https://render.com
   - Click "New" > "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` and create all services
   - Add environment variables for each service

3. **Configure Environment Variables**
   
   For each service, add the required variables in Render dashboard:
   
   **Auth Service:**
   - GITHUB_CLIENT_ID
   - GITHUB_CLIENT_SECRET
   - GITHUB_REDIRECT_URI (use Render URL)
   - JWT_SECRET
   - ENCRYPTION_KEY
   - REDIS_URL
   - FRONTEND_URL

   **Upload Service:**
   - AUTH_SERVICE_URL (auth service Render URL)
   - JWT_SECRET (same as auth)
   - R2_ACCESS_KEY_ID
   - R2_SECRET_ACCESS_KEY
   - R2_ENDPOINT
   - R2_BUCKET_NAME
   - REDIS_URL

   **Deploy Service:**
   - R2_ACCESS_KEY_ID
   - R2_SECRET_ACCESS_KEY
   - R2_ENDPOINT
   - R2_BUCKET_NAME
   - REDIS_URL

   **Request Handler:**
   - R2_ACCESS_KEY_ID
   - R2_SECRET_ACCESS_KEY
   - R2_ENDPOINT
   - R2_BUCKET_NAME

4. **Update Frontend Configuration**
   - Update frontend API URLs to point to Render services
   - Update CORS origins in auth-service if needed

### Option B: Deploy with Docker

1. **Build Images**
   ```bash
   docker-compose build
   ```

2. **Create .env file**
   ```bash
   cp server/.env.example .env
   # Edit .env with production values
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Check Status**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Post-Deployment Verification

### 1. Health Checks
Test each service health endpoint:

```bash
# Auth Service
curl https://<auth-domain>/health

# Upload Service
curl https://<upload-domain>/health

# Deploy Service
curl https://<deploy-domain>/health

# Request Handler
curl https://<handler-domain>/health
```

Expected response: `{"status":"healthy","service":"<service-name>",...}`

### 2. Authentication Flow
- [ ] Visit frontend and click "Login with GitHub"
- [ ] Complete GitHub OAuth authorization
- [ ] Verify redirect back to frontend with token
- [ ] Check token is valid by calling `/auth/me`

### 3. Upload Flow
- [ ] Create a test project
- [ ] Upload files through frontend
- [ ] Verify files appear in R2 bucket
- [ ] Check Redis for deployment entry

### 4. Build Flow
- [ ] Trigger deployment
- [ ] Check deploy-service logs for build progress
- [ ] Verify built files in R2 under `dist/<id>/`
- [ ] Check Redis status updated to "deployed"

### 5. Serving Flow
- [ ] Access deployed site via request-handler
- [ ] Verify static files load correctly
- [ ] Test different routes (if SPA)
- [ ] Check browser console for errors

## Security Hardening

### 1. Environment Variables
- [ ] All secrets stored in platform secret manager (not in code)
- [ ] No `.env` files committed to repository
- [ ] Environment variables validated on startup

### 2. CORS Configuration
- [ ] Only allow specific frontend origins
- [ ] Remove wildcard CORS in production
- [ ] Test CORS from frontend domain

### 3. Rate Limiting
- [ ] Auth endpoints rate limited (already configured)
- [ ] Upload endpoints rate limited (already configured)
- [ ] Consider adding rate limiting to other services

### 4. HTTPS/SSL
- [ ] All services use HTTPS
- [ ] SSL certificates valid
- [ ] HTTP redirects to HTTPS
- [ ] HSTS headers enabled (helmet middleware)

### 5. Input Validation
- [ ] File upload size limits enforced
- [ ] File type validation
- [ ] Request body size limits
- [ ] SQL injection prevention (N/A - using Redis)

### 6. Monitoring & Logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Create alerts for critical errors

## Performance Optimization

### 1. Caching
- [ ] Add CDN for request-handler (Cloudflare, etc.)
- [ ] Cache static assets with proper headers
- [ ] Consider Redis caching for frequent queries

### 2. Database
- [ ] Monitor Redis memory usage
- [ ] Set up Redis persistence if needed
- [ ] Configure connection pooling

### 3. File Storage
- [ ] Enable R2 CDN if available
- [ ] Compress files before upload
- [ ] Set appropriate cache headers

### 4. Service Optimization
- [ ] Enable gzip compression
- [ ] Optimize Docker images (multi-stage builds)
- [ ] Use production Node.js settings

## Monitoring Setup

### 1. Uptime Monitoring
Set up monitoring for:
- [ ] Auth service health endpoint
- [ ] Upload service health endpoint
- [ ] Deploy service health endpoint
- [ ] Request handler health endpoint

### 2. Error Tracking
- [ ] Integrate error tracking service
- [ ] Set up error notifications
- [ ] Configure error sampling

### 3. Metrics
Track:
- [ ] Request rates
- [ ] Response times
- [ ] Error rates
- [ ] Redis connection status
- [ ] R2 storage usage
- [ ] Build queue length

### 4. Logs
- [ ] Centralized logging configured
- [ ] Log retention policy set
- [ ] Log levels appropriate for production

## Backup & Recovery

### 1. Data Backup
- [ ] Redis backup strategy (Upstash handles this)
- [ ] R2 bucket versioning enabled
- [ ] Document recovery procedures

### 2. Disaster Recovery
- [ ] Document service dependencies
- [ ] Create runbook for common issues
- [ ] Test recovery procedures

## Documentation

- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document environment variables
- [ ] Create API documentation

## Final Checks

- [ ] All services running and healthy
- [ ] End-to-end user flow works
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Security scan passed
- [ ] Team trained on deployment process
- [ ] Rollback plan documented
- [ ] Support contacts documented

## Post-Launch

### Week 1
- [ ] Monitor error rates daily
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Fix critical bugs

### Month 1
- [ ] Review security logs
- [ ] Optimize slow endpoints
- [ ] Update documentation
- [ ] Plan next features

## Rollback Plan

If issues occur:

1. **Immediate Actions**
   - Check service logs
   - Verify environment variables
   - Test health endpoints

2. **Rollback Steps**
   - Revert to previous deployment
   - Clear Redis cache if needed
   - Notify users of downtime

3. **Post-Mortem**
   - Document what went wrong
   - Update deployment checklist
   - Improve testing procedures
