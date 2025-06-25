#!/bin/bash

# Test all microservices health endpoints

echo "🏥 Testing microservice health..."

services=(
    "API Gateway:http://localhost:3000/health"
    "Product Service:http://localhost:3001/api/health"
    "Cart Service:http://localhost:3002/api/health"
    "Order Service:http://localhost:3003/api/health"
    "AI Service:http://localhost:3004/api/health"
)

all_healthy=true

for service in "${services[@]}"; do
    name="${service%%:*}"
    url="${service##*:}"
    
    echo -n "   Testing $name... "
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo "🎉 All microservices are healthy!"
else
    echo "⚠️  Some microservices are not responding"
fi
