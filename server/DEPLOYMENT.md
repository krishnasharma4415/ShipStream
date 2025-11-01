# ShipStream Backend Deployment Guide

Deploy your ShipStream backend services to Render.com using manual dashboard setup within the "ship-stream" project.

## 🏗️ Architecture Overview

ShipStream consists of three microservices that work together:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Upload Service │    │  Deploy Service │    │ Request Handler │
│   (Web Service) │    │ (Background)    │    │  (Web Service)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cloudflare R2  │◄──►│  Upstash Redis  │    │  Cloudflare R2  │
│   (Storage)     │    │   (Queue)       │    │   (Serving)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Manual Deployment Steps

### Step 1: Create Render.com Project
1. Go to [Render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Project"**
3. Name your project: **"ship-stream"**
4. Connect your GitHub repository

### Step 2: Create Upload Service
1. **Inside ship-stream project**, click **"New Service"**
2. **Service Type**: Web Service
3. **Configuration**:
   ```
   Name: upload-service
   Runtime: Node
   Build Command: cd server/upload-service && npm install && npm run build
   Start Command: cd server/upload-service && npm start
   Plan: Free
   Region: Oregon (or closest to you)
   ```

4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   R2_ACCESS_KEY_ID=00f6cdec7e4aaf09b17ad0cb5500781f
   R2_SECRET_ACCESS_KEY=5dcf0c510e7f766cc312b21a1b8e2220236e5c8331cbe5c979dc4fd2e72a551e
   R2_ENDPOINT=https://f9c0b7aa60060632f3e8c6968af07c4f.r2.cloudflarestorage.com
   R2_BUCKET_NAME=ship-stream
   REDIS_URL=rediss://default:AYnuAAIncDE3YjA4MzJjZDUxOGM0NjcxYjljNjg4YmJiZWJmNzcwOXAxMzUzMTA@cuddly-pigeon-35310.upstash.io:6379
   FRONTEND_URL=http://localhost:5173
   ```

5. **Health Check Path**: `/health`
6. Click **"Create Web Service"**

### Step 3: Create Request Handler Service
1. **Inside ship-stream project**, click **"New Service"**
2. **Service Type**: Web Service
3. **Configuration**:
   ```
   Name: request-handler
   Runtime: Node
   Build Command: cd server/request-handler && npm install && npm run build
   Start Command: cd server/request-handler && npm start
   Plan: Free
   Region: Oregon (or closest to you)
   ```

4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   R2_ACCESS_KEY_ID=00f6cdec7e4aaf09b17ad0cb5500781f
   R2_SECRET_ACCESS_KEY=5dcf0c510e7f766cc312b21a1b8e2220236e5c8331cbe5c979dc4fd2e72a551e
   R2_ENDPOINT=https://f9c0b7aa60060632f3e8c6968af07c4f.r2.cloudflarestorage.com
   R2_BUCKET_NAME=ship-stream
   ```

5. **Health Check Path**: `/health`
6. Click **"Create Web Service"**

### Step 4: Create Deploy Service (Background Worker)
1. **Inside ship-stream project**, click **"New Service"**
2. **Service Type**: Background Worker
3. **Configuration**:
   ```
   Name: deploy-service
   Runtime: Node
   Build Command: cd server/deploy-service && npm install && npm run build
   Start Command: cd server/deploy-service && npm start
   Plan: Free
   Region: Oregon (or closest to you)
   ```

4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   R2_ACCESS_KEY_ID=00f6cdec7e4aaf09b17ad0cb5500781f
   R2_SECRET_ACCESS_KEY=5dcf0c510e7f766cc312b21a1b8e2220236e5c8331cbe5c979dc4fd2e72a551e
   R2_ENDPOINT=https://f9c0b7aa60060632f3e8c6968af07c4f.r2.cloudflarestorage.com
   R2_BUCKET_NAME=ship-stream
   REDIS_URL=rediss://default:AYnuAAIncDE3YjA4MzJjZDUxOGM0NjcxYjljNjg4YmJiZWJmNzcwOXAxMzUzMTA@cuddly-pigeon-35310.upstash.io:6379
   ```

5. Click **"Create Background Worker"**

## 📋 Service URLs After Deployment

After successful deployment, you'll get these URLs:

- **Upload Service**: `https://upload-service-[random].onrender.com`
- **Request Handler**: `https://request-handler-[random].onrender.com`
- **Deploy Service**: Background worker (no public URL)

## 🔧 Update Frontend Configuration

Once your upload service is deployed, update your frontend:

```bash
# In client/.env.local
VITE_API_URL=https://upload-service-[your-random-id].onrender.com
```

## 🧪 Testing Your Deployment

### Health Check Tests
```bash
# Test upload service
curl https://upload-service-[your-id].onrender.com/health

# Test request handler
curl https://request-handler-[your-id].onrender.com/health
```

### Complete Deployment Test
```bash
# 1. Deploy a test repository
curl -X POST https://upload-service-[your-id].onrender.com/send-url \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/vercel/next.js/tree/canary/examples/hello-world"}'

# Response will include deployment ID:
# {"generated": "abc123def", "files": [...]}

# 2. Monitor deployment status
curl "https://upload-service-[your-id].onrender.com/status?id=abc123def"

# Wait for status to change from "uploaded" → "deployed"
# This may take 2-5 minutes for the build to complete

# 3. Access deployed application (once status is "deployed")
curl https://request-handler-[your-id].onrender.com
# Set Host header to simulate subdomain: abc123def.yourdomain.com
```

### Expected Behavior
- **Before Deployment**: Request handler will show "NoSuchKey" errors (normal)
- **During Build**: Status will be "uploaded" then "building"
- **After Build**: Status will be "deployed" and files will be accessible

## 🔍 Monitoring & Troubleshooting

### Service Status
- Monitor all services in your **ship-stream** project dashboard
- Check logs for each service individually
- View deployment history and build logs

### Common Issues

**Build Failures:**
- Verify all environment variables are set correctly
- Check build logs in Render dashboard
- Ensure GitHub repository is accessible

**Service Won't Start:**
- Check for missing environment variables
- Verify Redis and R2 credentials
- Review start command paths
- If you see "Missing parameter name" error, redeploy after the Express version fix

**Redis Connection Issues:**
- Ensure REDIS_URL uses `rediss://` (with TLS)
- Verify Upstash Redis is active
- Check daily command limits

**R2 Access Issues:**
- Verify R2 credentials and permissions
- Check bucket name matches environment variable
- Ensure endpoint URL is correct

**"NoSuchKey" Errors (Normal):**
- This error appears when no deployments exist yet
- Request handler will show this until you deploy an application
- Deploy a test repository to populate R2 with files

### Free Tier Limitations
- **Cold Starts**: ~30 seconds after 15 minutes of inactivity
- **Build Time**: 15 minutes maximum
- **Monthly Hours**: 750 hours per service
- **Concurrent Builds**: One at a time

## 🌐 Custom Domain Setup (Optional)

### For Upload Service (API):
1. In Render dashboard, go to upload-service settings
2. Add custom domain: `api.yourdomain.com`
3. Update DNS: `CNAME api.yourdomain.com → upload-service-[id].onrender.com`

### For Request Handler (Apps):
1. In Render dashboard, go to request-handler settings
2. Add custom domain: `*.apps.yourdomain.com`
3. Update DNS: `CNAME *.apps.yourdomain.com → request-handler-[id].onrender.com`

## 📊 Service Responsibilities

### Upload Service
- **Purpose**: Handles repository cloning and upload to R2
- **Endpoints**: `/send-url`, `/status`, `/health`
- **Port**: Auto-assigned by Render
- **Dependencies**: Cloudflare R2, Upstash Redis

### Request Handler
- **Purpose**: Serves deployed applications via subdomain routing
- **Endpoints**: `/*` (catch-all), `/health`
- **Port**: Auto-assigned by Render
- **Dependencies**: Cloudflare R2

### Deploy Service
- **Purpose**: Background worker for processing build queue
- **Type**: Background Worker (no HTTP endpoints)
- **Dependencies**: Cloudflare R2, Upstash Redis

## 🔄 Deployment Workflow

1. **User submits GitHub URL** → Upload Service
2. **Repository cloned and uploaded** → Cloudflare R2
3. **Build job queued** → Upstash Redis
4. **Deploy service processes build** → Background
5. **Built files uploaded** → Cloudflare R2
6. **Application served** → Request Handler

## 📈 Scaling Considerations

### When to Upgrade:
- Multiple concurrent deployments needed
- Faster build times required
- Always-on services (no cold starts)

### Upgrade Options:
- **Starter Plan**: $7/month per service
- **Professional Plan**: $25/month per service
- **Custom Plans**: For enterprise needs

## 🔒 Security Best Practices

- ✅ Environment variables stored securely in Render
- ✅ HTTPS enabled automatically
- ✅ Services isolated within ship-stream project
- ✅ API tokens with minimal required permissions
- ✅ Redis connection uses TLS (rediss://)

## 📞 Support

- **Render Support**: [Render.com Help](https://render.com/docs)
- **Project Issues**: Check individual service logs
- **Performance**: Monitor in Render dashboard
- **Billing**: View usage in project settings

---

**🚢 Your ShipStream backend is now sailing in production!**

*All three services are deployed within your "ship-stream" project on Render.com's free tier.*