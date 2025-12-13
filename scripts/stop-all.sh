#!/bin/bash

# ShipStream - Stop All Services
# This script stops all running microservices

echo "🛑 Stopping ShipStream Services..."
echo "=================================="

# Find and kill Node.js processes running our services
pkill -f "node.*auth-service" && echo "✅ Stopped auth-service"
pkill -f "node.*upload-service" && echo "✅ Stopped upload-service"
pkill -f "node.*deploy-service" && echo "✅ Stopped deploy-service"
pkill -f "node.*request-handler" && echo "✅ Stopped request-handler"

echo ""
echo "✅ All services stopped"
