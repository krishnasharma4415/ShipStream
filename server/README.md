# Vercel-like Deployment Service

A microservices-based deployment platform similar to Vercel, built with Node.js, TypeScript, AWS S3, and Redis.

## Architecture

- **Upload Service** (Port 5500): Handles Git repository cloning and file uploads to S3
- **Deploy Service**: Background worker that processes build queue and deploys projects
- **Request Handler** (Port 3000): Serves deployed applications via subdomain routing

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Redis Server** running locally or remotely
3. **AWS S3** bucket named "vercel" or configure your own
4. **Git** installed on the system

## Setup

1. **Install dependencies and build all services:**
   ```bash
   # Run the setup script
   start-services.bat
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example file
   copy .env.example .env
   
   # Edit .env with your AWS credentials
   ACCESSID=your_aws_access_key_id
   ACCESSKEY=your_aws_secret_access_key
   ENDPOINT=your_s3_endpoint_url
   ```

3. **Start Redis server:**
   ```bash
   # If using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install Redis locally
   ```

## Running the Services

Start each service in a separate terminal:

```bash
# Terminal 1 - Upload Service
cd upload-service
npm start

# Terminal 2 - Deploy Service  
cd deploy-service
npm start

# Terminal 3 - Request Handler
cd request-handler
npm start
```

## Usage

1. **Deploy a repository:**
   ```bash
   curl -X POST http://localhost:5500/send-url \
     -H "Content-Type: application/json" \
     -d '{"repoUrl": "https://github.com/username/repo.git"}'
   ```

2. **Check deployment status:**
   ```bash
   curl "http://localhost:5500/status?id=YOUR_DEPLOYMENT_ID"
   ```

3. **Access deployed app:**
   ```
   http://YOUR_DEPLOYMENT_ID.localhost:3000
   ```

## Service Details

### Upload Service (Port 5500)
- Clones Git repositories
- Uploads files to S3
- Queues builds in Redis
- Provides status endpoint

### Deploy Service
- Processes build queue from Redis
- Downloads source from S3
- Runs `npm install && npm run build`
- Uploads built files back to S3

### Request Handler (Port 3000)
- Routes requests based on subdomain
- Serves static files from S3
- Handles content-type headers

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| ACCESSID | AWS Access Key ID | Yes |
| ACCESSKEY | AWS Secret Access Key | Yes |
| ENDPOINT | S3 Endpoint URL | Yes |
| REDIS_URL | Redis connection URL | No (defaults to localhost) |