# MyBasket Lite - Microservices Retail Application

A modern, scalable retail application built with Next.js frontend and Node.js microservices architecture. This application has been transformed from a monolithic structure into a distributed microservices system.

## 🏗️ Architecture Overview

The application consists of the following microservices:

### Frontend
- **Next.js Application** (Port 9002) - React-based frontend with server-side rendering

### Microservices
- **API Gateway** (Port 3000) - Central entry point, routing, rate limiting, and load balancing
- **Product Service** (Port 3001) - Product catalog management
- **Cart Service** (Port 3002) - Shopping cart operations
- **Order Service** (Port 3003) - Order processing and management
- **AI Service** (Port 3004) - AI-powered recommendations and suggestions

## 🚀 Quick Start

### Option 1: Development Mode (Recommended for development)

1. **Install dependencies for all services:**
   ```bash
   npm install
   npm run microservices:install
   ```

2. **Start all microservices:**
   ```bash
   npm run microservices:start
   ```

3. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```

4. **Verify everything is running:**
   ```bash
   npm run microservices:health
   ```

The application will be available at:
- Frontend: http://localhost:9002
- API Gateway: http://localhost:3000
- Individual service health checks: http://localhost:300X/api/health

### Option 2: Docker (Recommended for production-like testing)

1. **Build and start all services:**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

2. **View logs:**
   ```bash
   npm run docker:logs
   ```

3. **Stop all services:**
   ```bash
   npm run docker:down
   ```

## 📋 Available Scripts

### Development Scripts
- `npm run dev` - Start Next.js frontend in development mode
- `npm run dev:full` - Start microservices and frontend together
- `npm run build` - Build the Next.js application
- `npm run start` - Start the Next.js application in production mode

### Microservices Scripts
- `npm run microservices:install` - Install dependencies for all microservices
- `npm run microservices:start` - Start all microservices in development mode
- `npm run microservices:stop` - Stop all running microservices
- `npm run microservices:health` - Check health of all microservices

#### Windows Compatibility
For Windows users, OS-specific scripts are available:
- `npm run microservices:start:win` - Start microservices using Windows batch files
- `npm run microservices:stop:win` - Stop microservices using Windows batch files  
- `npm run microservices:health:win` - Health check using Windows batch files

**Note**: Windows batch files include UTF-8 encoding (`chcp 65001`) for proper emoji display in Command Prompt.

### Docker Scripts
- `npm run docker:build` - Build all Docker images
- `npm run docker:up` - Start all services with Docker Compose
- `npm run docker:down` - Stop and remove all Docker containers
- `npm run docker:logs` - View logs from all services

### Testing Scripts
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test:api` - Run API tests (when implemented)

## 🔧 Service Details

### API Gateway (Port 3000)
**Endpoints:**
- `GET /health` - Overall system health check
- `GET /info` - Gateway and service information
- `/api/products/*` - Proxy to Product Service
- `/api/cart/*` - Proxy to Cart Service
- `/api/orders/*` - Proxy to Order Service
- `/api/recommendations/*` - Proxy to AI Service

### Product Service (Port 3001)
**Endpoints:**
- `GET /api/products` - List products with filtering and pagination
- `GET /api/products/:id` - Get specific product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/categories` - Get product categories
- `GET /api/health` - Service health check

**Query Parameters for GET /api/products:**
- `category` - Filter by category
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `inStock` - Filter by stock availability
- `search` - Search in name/description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Cart Service (Port 3002)
**Endpoints:**
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/items` - Add item to cart
- `PUT /api/cart/:userId/items/:productId` - Update cart item quantity
- `DELETE /api/cart/:userId/items/:productId` - Remove item from cart
- `DELETE /api/cart/:userId` - Clear entire cart
- `GET /api/cart/:userId/summary` - Get cart summary
- `GET /api/health` - Service health check

### Order Service (Port 3003)
**Endpoints:**
- `POST /api/orders/:userId` - Create new order
- `GET /api/orders/:userId` - Get user's orders
- `GET /api/orders/:userId/:orderId` - Get specific order
- `PUT /api/orders/:userId/:orderId/status` - Update order status
- `POST /api/orders/:userId/:orderId/cancel` - Cancel order
- `GET /api/health` - Service health check

### AI Service (Port 3004)
**Endpoints:**
- `POST /api/recommendations/grocery-suggestions` - Get grocery suggestions
- `POST /api/recommendations/personalized` - Get personalized recommendations
- `POST /api/grocery-suggestions` - Legacy endpoint
- `GET /api/health` - Service health check

## 🧪 Testing the Application

### Manual Testing

1. **Start the services:**
   ```bash
   npm run microservices:start
   npm run dev
   ```

2. **Test Product Service:**
   ```bash
   curl http://localhost:3001/api/products
   curl http://localhost:3001/api/products/1
   curl http://localhost:3001/api/categories
   ```

3. **Test Cart Service:**
   ```bash
   # Add item to cart
   curl -X POST http://localhost:3002/api/cart/user-123/items \
     -H "Content-Type: application/json" \
     -d '{"productId": "1", "quantity": 2}'
   
   # Get cart
   curl http://localhost:3002/api/cart/user-123
   ```

4. **Test AI Service:**
   ```bash
   curl -X POST http://localhost:3004/api/recommendations/grocery-suggestions \
     -H "Content-Type: application/json" \
     -d '{"cartItems": ["apples", "chicken"]}'
   ```

5. **Test through API Gateway:**
   ```bash
   curl http://localhost:3000/api/products
   curl http://localhost:3000/health
   ```

### Frontend Testing

1. Visit http://localhost:9002
2. Browse products
3. Add items to cart
4. View cart and checkout
5. Check order history

## 🔒 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Microservices (.env files in each service)
```
# Common
NODE_ENV=development
PORT=300X

# Service-specific
PRODUCT_SERVICE_URL=http://localhost:3001
CART_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3004
```

## 📁 Project Structure

```
├── src/                          # Next.js frontend source
│   ├── app/                      # App router pages
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── lib/                      # Utilities and API clients
│   │   └── api/                  # Microservice API clients
│   └── data/                     # Sample data (fallback)
├── microservices/                # Microservices directory
│   ├── api-gateway/              # API Gateway service
│   ├── product-service/          # Product management service
│   ├── cart-service/             # Shopping cart service
│   ├── order-service/            # Order management service
│   └── ai-service/               # AI recommendations service
├── scripts/                      # Development scripts
├── docker-compose.yml            # Docker configuration
└── README.md                     # This file
```

## 🐛 Troubleshooting

### Services Won't Start
1. Check if ports are available: `npm run microservices:stop`
2. Install dependencies: `npm run microservices:install`
3. Check Node.js version (requires Node 18+)

### Frontend Can't Connect to Services
1. Verify microservices are running: `npm run microservices:health`
2. Check API Gateway is accessible: `curl http://localhost:3000/health`
3. Verify environment variables in `.env.local`

### Docker Issues
1. Ensure Docker is running
2. Clean up: `docker system prune -f`
3. Rebuild: `npm run docker:build`

## 🚀 Deployment

### Production Deployment

1. **Build all services:**
   ```bash
   npm run docker:build
   ```

2. **Deploy with Docker Compose:**
   ```bash
   npm run docker:up
   ```

3. **For cloud deployment**, consider:
   - Container orchestration (Kubernetes, ECS)
   - Service mesh (Istio, Linkerd)
   - API Gateway (Kong, Ambassador)
   - Monitoring (Prometheus, Grafana)

## 🛠️ Development

### Adding New Features

1. **Frontend**: Add components in `src/components/`
2. **API**: Update service clients in `src/lib/api/`
3. **Backend**: Modify appropriate microservice
4. **Database**: Each service manages its own data

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (configure as needed)

## 📈 Scaling Considerations

- Each microservice can be scaled independently
- Use container orchestration for production
- Implement caching (Redis) for frequently accessed data
- Add monitoring and logging
- Consider message queues for async communication

## 🤝 Contributing & Forking

### How This Repository Was Forked

This repository was originally forked from [uppadhyayraj/my-basket-app](https://github.com/uppadhyayraj/my-basket-app) to add Windows compatibility improvements.

**Forking Process:**

**Step 1: Create Your Fork**
- **Option A**: If you have access to the original repository:
  1. Go to https://github.com/uppadhyayraj/my-basket-app
  2. Click the "Fork" button (top right)
  3. Select your GitHub account to fork it to
  
- **Option B**: If the repository is private or you can't fork:
  1. Create a new repository on your GitHub account named `my-basket-app`
  2. Make it public or private as needed
  3. **Don't** initialize with README (you'll push existing code)

**Step 2: Clone Your Repository**
```bash
# Replace 'mjalav' with your actual GitHub username
git clone https://github.com/mjalav/my-basket-app
cd my-basket-app
```
**⚠️ Important**: Replace `mjalav` with your actual GitHub username before running the command!

**Step 3: Add Upstream Remote** (for getting updates from original)
```bash
git remote add upstream https://github.com/uppadhyayraj/my-basket-app
```

**Step 4: Update from Upstream** (when needed)
```bash
git fetch upstream
git merge upstream/main
```

### Windows Compatibility Improvements

This fork includes Windows-specific enhancements:

**Files Added:**
- `scripts/start-microservices.bat` - Windows batch script for starting services
- `scripts/stop-microservices.bat` - Windows batch script for stopping services  
- `scripts/health-check.bat` - Windows batch script for health checks

**Key Features:**
- UTF-8 encoding support for proper emoji display (`chcp 65001`)
- Windows Command Prompt compatibility  
- OS-specific npm scripts (`:win` and `:unix` suffixes)
- Cross-platform development workflow

**Branch Structure:**
- `main` - Synced with upstream repository
- `fix/windows-microservices-compatibility` - Windows compatibility features
- `fix/windows-emoji-display-utf8` - UTF-8 encoding improvements

### Contributing to This Fork

1. **Fork this repository** to your GitHub account:
   - Go to https://github.com/mjalav/my-basket-app
   - Click "Fork" button
2. **Clone your fork**:
   ```bash
   # Replace 'your-username' with your actual GitHub username
   git clone https://github.com/your-username/my-basket-app
   cd my-basket-app
   ```
3. **Create a feature branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make changes and test** on your platform
5. **Commit with clear messages**
6. **Push and create a pull request**

### Contributing to Original Repository

To contribute back to the original repository, submit pull requests to [uppadhyayraj/my-basket-app](https://github.com/uppadhyayraj/my-basket-app).

## 📄 License

This project is for educational purposes. Feel free to use and modify as needed.
