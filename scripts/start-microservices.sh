#!/bin/bash

# Start all microservices in development mode

echo "🚀 Starting microservices in development mode..."

# Check if 1Password CLI is available
if command -v op &> /dev/null; then
    echo "🔐 1Password CLI detected. Secrets will be injected from vault."
    OP_PREFIX="op run --env-file=\"../../.env.local\" --"
else
    echo "⚠️  1Password CLI not found. Using local environment only."
    OP_PREFIX=""
fi

# Kill any existing processes on the ports
echo "🔄 Killing existing processes..."
lsof -ti:3000,3001,3002,3003,3004 | xargs kill -9 2>/dev/null || true

# Function to start a service in background
start_service() {
    local service_path=$1
    local service_name=$2
    local port=$3
    
    echo "📦 Starting $service_name on port $port..."
    cd "$service_path"
    npm install &> /dev/null
    $OP_PREFIX npm run dev &
    cd - > /dev/null
}

# Start all services
start_service "microservices/product-service" "Product Service" 3001
start_service "microservices/cart-service" "Cart Service" 3002
start_service "microservices/order-service" "Order Service" 3003
start_service "microservices/ai-service" "AI Service" 3004
start_service "microservices/api-gateway" "API Gateway" 3000

echo "⏳ Waiting for services to start up..."
sleep 10

echo "✅ All microservices are starting up!"
echo ""
echo "📋 Service URLs:"
echo "   🌐 API Gateway:     http://localhost:3000"
echo "   📦 Product Service: http://localhost:3001"
echo "   🛒 Cart Service:    http://localhost:3002"
echo "   📋 Order Service:   http://localhost:3003"
echo "   🤖 AI Service:      http://localhost:3004"
echo ""
echo "🔍 Health checks:"
echo "   curl http://localhost:3000/health"
echo ""
echo "⚠️  Note: Run 'npm run dev' in the main directory to start the Next.js frontend"
echo "   Frontend will be available at: http://localhost:9002"
