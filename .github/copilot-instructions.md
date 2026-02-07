# MyBasket Lite - AI Coding Agent Instructions

## Architecture Overview

This is a **full-stack microservices e-commerce application** with a Next.js frontend (port 9002) and 5 independent Node.js microservices running through an API Gateway.

### Service Architecture
- **API Gateway** (port 3000): Express-based central hub with rate limiting, CORS, compression, and service proxying
- **Product Service** (port 3001): Catalog management with filtering, pagination, categories
- **Cart Service** (port 3002): Shopping cart operations with cross-service product validation
- **Order Service** (port 3003): Order processing with cart dependency
- **AI Service** (port 3004): Google Genkit-powered recommendations engine
- **Next.js Frontend** (port 9002): React with TypeScript, Radix UI components, server-side rendering

### Key Design Decisions
- **Service isolation**: Each microservice has its own Express app, package.json, TypeScript config, and Docker setup
- **No persistent storage**: In-memory Maps used (cart/order data lost on restart)
- **Cross-service clients**: Services call each other directly (cart-service → product-service)
- **Frontend API client**: Single `ApiClient` class (`src/lib/api/client.ts`) handles all gateway communication
- **Session-based users**: Frontend uses `getUserId()` from `src/lib/session.ts` for user context

## Critical Developer Workflows

### Starting Development
```bash
# Terminal 1: Start all microservices
npm run microservices:start

# Terminal 2: Start Next.js frontend (automatically runs on port 9002)
npm run dev

# Verify health (all services should return 200)
npm run microservices:health
```

### Docker Development
```bash
npm run docker:build    # Build all images
npm run docker:up       # Start all containers
npm run docker:logs     # Stream logs from all services
npm run docker:down     # Stop and remove containers
```

### Essential Commands
- `npm run typecheck` - Validate TypeScript (catches type errors)
- `npm run lint` - ESLint validation
- `npm run microservices:install` - Install all microservice dependencies

### Debugging Pattern
Services expose Swagger docs at `http://localhost:300X/api-docs`. Gateway health endpoint at `/health` shows status of all downstream services. Check service logs via `npm run docker:logs` when using Docker.

## Project-Specific Conventions

### Frontend Data Flow
1. Components import `useApiCart()` hook from `src/hooks/useApiCart.ts`
2. Hook uses `apiClient.getCart(userId)` to fetch from `/api/cart/:userId`
3. API Gateway proxies to Cart Service via `http-proxy-middleware`
4. Cart Service calls ProductServiceClient to hydrate product details
5. Response includes full product data (name, price, image, stock status)

**Never** use local CartContext for persistent data; always use ApiCartContext for server-backed state.

### Service-to-Service Communication
- **Cart Service** → calls `ProductServiceClient` to validate products before adding to cart
- **Order Service** → calls Cart Service to fetch cart items and clear after order creation
- Pattern: Each service has a `*-client.ts` file (e.g., `product-client.ts`) with hardcoded internal URLs

### Type Sharing
- Frontend types (`ApiCartItem`, `Cart`, `Product`) are duplicated in:
  - `src/contexts/ApiCartContext.tsx`
  - `src/hooks/useApiCart.ts`
  - `microservices/cart-service/src/types.ts`
- **Action needed**: Extract shared types to avoid desync (current: manual synchronization)

### API Response Pattern
All endpoints return JSON with structure: `{ data?, items?, cart?, order?, error? }` depending on operation. Status codes: 200 (success), 400 (validation), 404 (not found), 500 (server error).

## Integration Points & External Dependencies

### Google Genkit (AI Service)
- Located at `src/ai/genkit.ts` - singleton `ai` export configured for `googleai/gemini-2.0-flash`
- Used in `src/ai/flows/grocery-suggestions.ts` for Genkit flow definitions
- Requires `GOOGLE_GENKIT_API_KEY` environment variable
- Frontend calls via `/api/recommendations/grocery-suggestions` endpoint

### Radix UI Components
- Imported from `src/components/ui/` (shadcn-based library)
- Used throughout layout, form, and dialog components
- Fully typed with React hooks (useEffect, useState patterns throughout)

### Docker Network
- Services communicate via service names on `microservices-network` bridge network
- Environment variables override localhost URLs (e.g., `PRODUCT_SERVICE_URL=http://product-service:3001`)
- Frontend uses `NEXT_PUBLIC_API_URL` env var (defaults to localhost during dev)

### Package.json Key Dependencies
- **Next.js with Turbopack**: Dev mode uses `--turbopack` flag for faster builds
- **Express microservices**: All use `express`, `cors`, `helmet`, `compression`, `express-rate-limit`
- **UUID generation**: `uuid` package used for cart/order IDs
- **Swagger/OpenAPI**: Each service has `swagger.ts` for API documentation

## File Organization Patterns

### Frontend (`src/`)
- `app/` - Next.js routes (cart, checkout, orders, products)
- `components/` - React components (organized by feature: cart, checkout, orders, products, layout)
- `contexts/` - Two cart contexts: `CartContext` (local) and `ApiCartContext` (API-backed)
- `hooks/` - Custom hooks (useApiCart, useApiOrders, useCart, useMobile)
- `lib/api/` - `client.ts` (main API class), `products.ts`, `cart.ts`, `orders.ts`, `ai.ts` (client wrappers)
- `lib/` - `session.ts` (getUserId), `types.ts`, `utils.ts`

### Microservices (`microservices/`)
Each service follows identical structure:
- `src/index.ts` - Express app setup, port configuration, middleware
- `src/routes.ts` - Route definitions with JSDoc swagger comments
- `src/service.ts` - Business logic (CartService, ProductService, etc.)
- `src/types.ts` - TypeScript interfaces
- `src/swagger.ts` - Swagger documentation setup
- `src/*-client.ts` (if needed) - HTTP clients for calling other services

## Critical Gotchas & Known Issues

1. **In-memory storage**: Cart and order data is lost on service restart. Fixes require database integration.
2. **Type duplication**: Update types in BOTH frontend and microservices to keep in sync.
3. **CORS headers**: Verify `CORS` is enabled in all services (required for frontend to call gateway).
4. **Port conflicts**: If services fail to start, check that ports 3000-3004, 9002 are available.
5. **Environment variables**: Frontend vars must be prefixed `NEXT_PUBLIC_` to be exposed to browser.
6. **Hardcoded URLs**: Service-to-service calls use hardcoded localhost URLs in dev, Docker service names in containers.

## When Adding New Features

- **New API endpoint**: Create in microservice `routes.ts`, update API Gateway proxy config, add client method in `src/lib/api/`, create React component/hook
- **New cart operation**: Update `CartService.ts`, add route, update `ApiClient`, update `useApiCart` hook
- **New recommendation feature**: Add Genkit flow in `src/ai/flows/`, expose via AI Service routes, call via frontend component
- **New page/form**: Use Radix UI components from `src/components/ui/`, wrap with AppLayout from `src/components/layout/AppLayout.tsx`
