# GitHub OAuth Setup Guide

## Problem
GitHub OAuth apps only allow ONE callback URL per application. You need separate OAuth apps for local development and production.

## Solution: Create Two GitHub OAuth Apps

### 1. Production OAuth App (Already exists)

**Settings:**
- Go to: https://github.com/settings/developers
- Select your existing OAuth App (Client ID: `Ov23liDYU0gZhKpiEmPO`)
- Update the **Authorization callback URL** to:
  ```
  https://auth-service-gj8t.onrender.com/auth/github/callback
  ```
- Click "Update application"

**Environment:** Use `server/.env.production` for production deployments

### 2. Local Development OAuth App (Create New)

**Steps:**
1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name:** `ShipStream Local Dev`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:5501/auth/github/callback`
4. Click **"Register application"**
5. Click **"Generate a new client secret"**
6. Copy the **Client ID** and **Client Secret**
7. Update `server/.env` with the new credentials:
   ```
   GITHUB_CLIENT_ID=<your-new-local-client-id>
   GITHUB_CLIENT_SECRET=<your-new-local-client-secret>
   ```

## Deployment Configuration

### Render.com (Backend Services)

For each service on Render, add these environment variables:

**auth-service:**
```
GITHUB_CLIENT_ID=Ov23liDYU0gZhKpiEmPO
GITHUB_CLIENT_SECRET=b8c19dc3f7c24c4786803a9a38cdeac619c42c2f
GITHUB_REDIRECT_URI=https://auth-service-gj8t.onrender.com/auth/github/callback
FRONTEND_URL=https://ship-stream.vercel.app
AUTH_SERVICE_PORT=5501
JWT_SECRET=eE9QeGMyvmtC8YBhP4l/itZSGbTZTkZGStiBF7QEnHk=
ENCRYPTION_KEY=GR2N8xTp02ogWHTf2yIP4RfdOMC6HXcSqGIzDKof7n0=
REDIS_URL=rediss://default:AYnuAAIncDE3YjA4MzJjZDUxOGM0NjcxYjljNjg4YmJiZWJmNzcwOXAxMzUzMTA@cuddly-pigeon-35310.upstash.io:6379
NODE_ENV=production
```

**upload-service:**
```
UPLOAD_SERVICE_PORT=5500
R2_ACCESS_KEY_ID=00f6cdec7e4aaf09b17ad0cb5500781f
R2_SECRET_ACCESS_KEY=5dcf0c510e7f766cc312b21a1b8e2220236e5c8331cbe5c979dc4fd2e72a551e
R2_ENDPOINT=https://f9c0b7aa60060632f3e8c6968af07c4f.r2.cloudflarestorage.com
R2_BUCKET_NAME=ship-stream
REDIS_URL=rediss://default:AYnuAAIncDE3YjA4MzJjZDUxOGM0NjcxYjljNjg4YmJiZWJmNzcwOXAxMzUzMTA@cuddly-pigeon-35310.upstash.io:6379
AUTH_SERVICE_URL=https://auth-service-gj8t.onrender.com
NODE_ENV=production
```

**deploy-service:**
```
DEPLOY_SERVICE_PORT=5502
REDIS_URL=rediss://default:AYnuAAIncDE3YjA4MzJjZDUxOGM0NjcxYjljNjg4YmJiZWJmNzcwOXAxMzUzMTA@cuddly-pigeon-35310.upstash.io:6379
AUTH_SERVICE_URL=https://auth-service-gj8t.onrender.com
NODE_ENV=production
```

**request-handler:**
```
REQUEST_HANDLER_PORT=3000
AUTH_SERVICE_URL=https://auth-service-gj8t.onrender.com
UPLOAD_SERVICE_URL=https://upload-service-m12v.onrender.com
DEPLOY_SERVICE_URL=https://shipstream.onrender.com
NODE_ENV=production
```

### Vercel (Frontend)

Add these environment variables in Vercel dashboard:

```
VITE_AUTH_SERVICE_URL=https://auth-service-gj8t.onrender.com
VITE_UPLOAD_SERVICE_URL=https://upload-service-m12v.onrender.com
VITE_DEPLOY_SERVICE_URL=https://shipstream.onrender.com
VITE_REQUEST_HANDLER_URL=https://request-handler-etqx.onrender.com
```

## Quick Reference

| Environment | OAuth App | Callback URL |
|-------------|-----------|--------------|
| **Production** | Existing app | `https://auth-service-gj8t.onrender.com/auth/github/callback` |
| **Local Dev** | New app (to create) | `http://localhost:5501/auth/github/callback` |

## Testing

**Local:**
```bash
# Make sure you're using the local OAuth app credentials
npm run start
# Visit: http://localhost:5173
```

**Production:**
```bash
# Visit: https://ship-stream.vercel.app
```
