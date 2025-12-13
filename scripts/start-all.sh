#!/bin/bash

# ShipStream - Start All Services
# This script starts all microservices for local development

set -e

echo "🚀 Starting ShipStream Services..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "❌ Error: server/.env file not found"
    echo "📝 Copy server/.env.example to server/.env and configure it"
    exit 1
fi

# Validate environment
echo -e "\n${BLUE}Validating environment...${NC}"
node scripts/validate-env.js
if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed"
    exit 1
fi

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    
    echo -e "\n${BLUE}Starting $service on port $port...${NC}"
    cd "server/$service"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies for $service..."
        npm install
    fi
    
    # Build
    echo "🔨 Building $service..."
    npm run build
    
    # Start in background
    npm start &
    
    cd ../..
    
    # Wait for service to be ready
    echo "⏳ Waiting for $service to be ready..."
    for i in {1..30}; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service is ready${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo "⚠️  $service may not be ready yet"
}

# Start services
start_service "auth-service" 5501
start_service "upload-service" 5500
start_service "deploy-service" 5502
start_service "request-handler" 3000

echo -e "\n=================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "Service URLs:"
echo "  Auth Service:    http://localhost:5501"
echo "  Upload Service:  http://localhost:5500"
echo "  Deploy Service:  http://localhost:5502"
echo "  Request Handler: http://localhost:3000"
echo ""
echo "Health Checks:"
echo "  curl http://localhost:5501/health"
echo "  curl http://localhost:5500/health"
echo "  curl http://localhost:5502/health"
echo "  curl http://localhost:3000/health"
echo ""
echo "To stop all services:"
echo "  ./scripts/stop-all.sh"
echo ""
