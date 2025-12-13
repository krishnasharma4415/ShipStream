# 🚀 Deployment Checklist

## Pre-Deployment

### 1. Environment Setup
- [ ] Copy `server/.env.example` to `server/.env` and fill in values
- [ ] Copy `client/.env.example` to `client/.env.local` and fill in values
- [ ] Generate secure keys:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 2. External Services
- [ ] Create Cloudflare R2 bucket
- [ ] Create Upstash Redis database
- [ ] Create GitHub OAuth App
- [ ] Note all credentials

### 3. Local Testing
- [ ] Install dependencies: `cd server/auth-service && npm install` (repeat for all services)
- [ ] Build services: `npm run build` (in each service)
- [ ] Start services: `cd server && npm start`
- [ ] Start frontend: `cd client && npm run dev`
- [ ] Test authentication flow
- [ ] Test deployment flow

## Production Deployment

### Backend (Render.com)

#### Option 1: Blueprint Deploy (Recommended)
1. Fork repository to your GitHub
2. Go to Render Dashboard → New → Blueprint
3. Connect repository
4. Set environment variables from `.env.production.example`
5. Deploy

#### Option 2: Manual Deploy
Create 4 web services:

**Auth Service**
- Build: `cd server/auth-service && npm install && npm run build`
- Start: `cd server/auth-service && npm start`
- Add environment variables

**Upload Service**
- Build: `cd server/upload-service && npm install && npm run build`
- Start: `cd server/upload-service && npm start`
- Add environment variables

**Deploy Service**
- Build: `cd server/deploy-service && npm install && npm run build`
- Start: `cd server/deploy-service && npm start`
- Add environment variables

**Request Handler**
- Build: `cd server/request-handler && npm install && npm run build`
- Start: `cd server/request-handler && npm start`
- Add environment variables

### Frontend (Vercel)

1. Go to Vercel Dashboard → New Project
2. Import repository
3. Configure:
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   ```
   VITE_AUTH_SERVICE_URL=https://your-auth-service.onrender.com
   VITE_UPLOAD_SERVICE_URL=https://your-upload-service.onrender.com
   ```
5. Deploy

### Post-Deployment

- [ ] Update GitHub OAuth callback URL to production URL
- [ ] Test all service health endpoints
- [ ] Test authentication flow
- [ ] Test deployment flow
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerts

## Environment Variables Reference

See `.env.production.example` for complete list of required variables.

### Critical Variables
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `JWT_SECRET` & `ENCRYPTION_KEY` (32+ characters)
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`
- `REDIS_URL`
- All service URLs

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Verify all dependencies installed
- Check TypeScript compilation errors

### Service Won't Start
- Verify environment variables set
- Check logs in Render dashboard
- Ensure ports not conflicting

### Authentication Fails
- Verify GitHub OAuth callback URL
- Check JWT_SECRET matches across services
- Verify CORS settings

### Deployment Fails
- Check Redis connection
- Verify R2 credentials
- Check deploy service logs

## Support

For detailed documentation, see [README.md](README.md)
