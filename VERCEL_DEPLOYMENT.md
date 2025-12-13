# Vercel Deployment Fix

## Problem
Your deployed frontend is trying to connect to `localhost:5501` instead of the production auth service.

## Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: `ship-stream`
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Environment Variables

Add each of these variables with the value for **Production** environment:

| Variable Name | Value |
|---------------|-------|
| `VITE_AUTH_SERVICE_URL` | `https://auth-service-gj8t.onrender.com` |
| `VITE_UPLOAD_SERVICE_URL` | `https://upload-service-m12v.onrender.com` |
| `VITE_DEPLOY_SERVICE_URL` | `https://shipstream.onrender.com` |
| `VITE_REQUEST_HANDLER_URL` | `https://request-handler-etqx.onrender.com` |
| `VITE_FRONTEND_URL` | `https://ship-stream.vercel.app` |

**Important:** Make sure to select **Production** environment for each variable!

### Step 3: Redeploy

After adding the environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the **⋯** (three dots) menu
4. Select **Redeploy**
5. Check **Use existing Build Cache** (optional, faster)
6. Click **Redeploy**

OR simply push a new commit to trigger automatic deployment.

## Alternative: Deploy from CLI

If you have Vercel CLI installed:

```bash
cd client

# Set environment variables
vercel env add VITE_AUTH_SERVICE_URL production
# Enter: https://auth-service-gj8t.onrender.com

vercel env add VITE_UPLOAD_SERVICE_URL production
# Enter: https://upload-service-m12v.onrender.com

vercel env add VITE_DEPLOY_SERVICE_URL production
# Enter: https://shipstream.onrender.com

vercel env add VITE_REQUEST_HANDLER_URL production
# Enter: https://request-handler-etqx.onrender.com

vercel env add VITE_FRONTEND_URL production
# Enter: https://ship-stream.vercel.app

# Redeploy
vercel --prod
```

## Verify

After redeployment:
1. Visit: https://ship-stream.vercel.app
2. Open browser DevTools (F12) → Network tab
3. Try to login
4. Check that requests go to `https://auth-service-gj8t.onrender.com` (not localhost)

## Local vs Production

- **Local Development** (`.env.local`): Uses `http://localhost:5501`
- **Production** (Vercel env vars): Uses `https://auth-service-gj8t.onrender.com`

The `.env.production` file I created is a reference, but Vercel uses the environment variables you set in the dashboard.
