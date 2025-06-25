#!/bin/bash

# Stop all microservices

echo "🛑 Stopping all microservices..."

# Kill processes on specific ports
ports=(3000 3001 3002 3003 3004 9002)

for port in "${ports[@]}"; do
    echo "   🔄 Stopping service on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

echo "✅ All microservices stopped!"
