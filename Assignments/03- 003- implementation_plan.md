# Health Check Implementation Plan
## Cart Service - Production-Grade Health Checks

**Target Service:** Cart Service  
**Objective:** Implement robust health check system with dependency validation, resource monitoring, and proper orchestration support  
**Approach:** Test-Driven Development (TDD)  
**Estimated Effort:** 3-4 developer weeks

---

## User Review Required

> [!WARNING]
> **Breaking Changes**
> - Health endpoint response structure will change (additional fields added)
> - New endpoints `/api/health/live` and `/api/health/ready` will be added
> - Docker Compose configuration will require health check support
> - Existing monitoring/alerting may need updates to use new endpoints

> [!IMPORTANT]
> **Critical Design Decisions**
> - **Health check caching:** 30-second cache to prevent overwhelming dependencies
> - **Timeout configuration:** 5 seconds for Product Service calls, 2 seconds for health checks
> - **Memory threshold:** 80% of available heap triggers unhealthy status
> - **Cart count limit:** 10,000 carts maximum before degraded state
> - **In-memory storage limitation:** Accepted - no database will be added

> [!CAUTION]
> **Production Deployment Considerations**
> - Update Kubernetes/Docker orchestration to use new `/api/health/ready` endpoint
> - Update monitoring dashboards to consume new health check response format
> - Ensure API Gateway health check timeout (5s) accommodates new dependency checks
> - Plan for gradual rollout to avoid restart storms

---

## Proposed Changes

### Component 1: Health Check Service (New)

#### [NEW] [health-check.service.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/health-check.service.ts)

**Purpose:** Centralized health check logic with dependency validation, resource monitoring, and caching

**Features:**
- Product Service health validation with timeout
- Memory usage monitoring (Node.js heap)
- Cart count monitoring (Map size)
- Health check result caching (30 seconds)
- Liveness check (simple alive check)
- Readiness check (dependencies + resources)
- Detailed metrics in response

**Key Methods:**
```typescript
class HealthCheckService {
  // Check if Product Service is healthy
  async checkProductService(): Promise<DependencyHealth>
  
  // Check memory usage
  checkMemoryUsage(): ResourceHealth
  
  // Check cart count
  checkCartCount(cartService: CartService): ResourceHealth
  
  // Liveness check (always returns healthy unless critical failure)
  async checkLiveness(): Promise<HealthCheckResponse>
  
  // Readiness check (dependencies + resources)
  async checkReadiness(cartService: CartService): Promise<HealthCheckResponse>
  
  // Full health check with all details
  async checkHealth(cartService: CartService): Promise<HealthCheckResponse>
}
```

**Caching Strategy:**
- Cache health check results for 30 seconds
- Invalidate cache on explicit refresh
- Separate cache for liveness (60s) and readiness (30s)

---

### Component 2: Product Service Client Updates

#### [MODIFY] [product-client.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/product-client.ts)

**Changes:**

1. **Add timeout configuration:**
```typescript
private readonly timeout = 5000; // 5 seconds
private readonly healthCheckTimeout = 2000; // 2 seconds for health checks
```

2. **Add health check method:**
```typescript
async checkHealth(): Promise<boolean> {
  try {
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/api/health`,
      { timeout: this.healthCheckTimeout }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
```

3. **Update getProduct with timeout:**
```typescript
async getProduct(productId: string): Promise<Product | null> {
  try {
    const response = await axios.get<Product>(
      `${PRODUCT_SERVICE_URL}/api/products/${productId}`,
      { timeout: this.timeout }
    );
    return response.data as Product;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Product service timeout');
    }
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(`Product service error: ${error.message}`);
  }
}
```

4. **Improve error categorization:**
```typescript
private categorizeError(error: any): ErrorCategory {
  if (error.code === 'ECONNABORTED') return 'TIMEOUT';
  if (error.code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
  if (error.code === 'ETIMEDOUT') return 'NETWORK_TIMEOUT';
  if (error.response?.status >= 500) return 'SERVER_ERROR';
  if (error.response?.status === 404) return 'NOT_FOUND';
  return 'UNKNOWN';
}
```

---

### Component 3: Routes Updates

#### [MODIFY] [routes.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/routes.ts)

**Changes:**

1. **Replace existing health endpoint (lines 189-191):**

```typescript
import { HealthCheckService } from './health-check.service';

const healthCheckService = new HealthCheckService();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive health check
 *     description: Check service health including dependencies and resources
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheckResponse'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheckResponse'
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkHealth(cartService);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});
```

2. **Add liveness endpoint:**

```typescript
/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Check if service is alive (for Kubernetes liveness probe)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/health/live', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkLiveness();
    res.status(200).json(health);
  } catch (error) {
    console.error('Liveness check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed',
    });
  }
});
```

3. **Add readiness endpoint:**

```typescript
/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Check if service is ready to handle traffic (for Kubernetes readiness probe)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkReadiness(cartService);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
    });
  }
});
```

---

### Component 4: Type Definitions Updates

#### [MODIFY] [types.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/types.ts)

**Add new types:**

```typescript
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface DependencyHealth {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  error?: string;
}

export interface ResourceHealth {
  name: string;
  status: HealthStatus;
  value: number;
  limit: number;
  percentage: number;
  unit: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  checks?: {
    dependencies?: DependencyHealth[];
    resources?: ResourceHealth[];
  };
  responseTime?: number;
  error?: string;
}

export type ErrorCategory = 
  | 'TIMEOUT' 
  | 'CONNECTION_REFUSED' 
  | 'NETWORK_TIMEOUT' 
  | 'SERVER_ERROR' 
  | 'NOT_FOUND' 
  | 'UNKNOWN';
```

---

### Component 5: Swagger Documentation Updates

#### [MODIFY] [swagger.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/swagger.ts)

**Add schema definitions:**

```typescript
// Add to components.schemas
HealthCheckResponse: {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['healthy', 'unhealthy', 'degraded'],
      description: 'Overall health status'
    },
    service: {
      type: 'string',
      description: 'Service name'
    },
    version: {
      type: 'string',
      description: 'Service version'
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Check timestamp'
    },
    uptime: {
      type: 'number',
      description: 'Service uptime in seconds'
    },
    checks: {
      type: 'object',
      properties: {
        dependencies: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/DependencyHealth'
          }
        },
        resources: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ResourceHealth'
          }
        }
      }
    },
    responseTime: {
      type: 'number',
      description: 'Health check response time in ms'
    },
    error: {
      type: 'string',
      description: 'Error message if unhealthy'
    }
  }
}
```

---

### Component 6: Infrastructure Updates

#### [MODIFY] [docker-compose.yml](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/docker-compose.yml)

**Update cart-service configuration (lines 33-44):**

```yaml
# Cart Service
cart-service:
  build: ./microservices/cart-service
  ports:
    - "3002:3002"
  environment:
    - NODE_ENV=development
    - PORT=3002
    - PRODUCT_SERVICE_URL=http://product-service:3001
  depends_on:
    product-service:
      condition: service_healthy
  networks:
    - microservices-network
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/api/health/ready"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 40s
```

**Update product-service to add healthcheck (lines 22-30):**

```yaml
# Product Service
product-service:
  build: ./microservices/product-service
  ports:
    - "3001:3001"
  environment:
    - NODE_ENV=development
    - PORT=3001
  networks:
    - microservices-network
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 30s
```

#### [MODIFY] [Dockerfile](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/Dockerfile)

**Add wget for health checks (after line 1):**

```dockerfile
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# ... rest of Dockerfile
```

**Add HEALTHCHECK instruction (before CMD):**

```dockerfile
# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health/ready || exit 1

# Start the application
CMD ["npm", "start"]
```

---

### Component 7: Package Dependencies

#### [MODIFY] [package.json](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/package.json)

**No new dependencies required** - all functionality uses existing packages:
- `axios` - already installed (HTTP client)
- `express` - already installed (web framework)
- `zod` - already installed (validation)

**Optional (for future circuit breaker):**
```json
"dependencies": {
  "opossum": "^8.1.0"  // Circuit breaker library
}
```

---

## Verification Plan

### Automated Tests

#### Test Framework: Playwright TypeScript API Testing

**Test execution commands:**
```bash
# Navigate to test project
cd cart-service-api-tests

# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm test -- issue1-dependency-validation.spec.ts

# Run with UI mode
npm test -- --ui

# Generate HTML report
npm run test:report

# Run in headed mode (see browser)
npm test -- --headed
```

#### Test Suites (30+ test cases)

1. **Issue #1: Dependency Validation** (`issue1-dependency-validation.spec.ts`)
   - ✅ Health check returns 200 when Product Service healthy
   - ✅ Health check returns 503 when Product Service down
   - ✅ Health check includes Product Service status in response
   - ✅ Readiness check fails when dependency unhealthy
   - ✅ Liveness check succeeds even when dependency down

2. **Issue #2: Liveness vs Readiness** (`issue2-liveness-readiness.spec.ts`)
   - ✅ Liveness endpoint exists at `/api/health/live`
   - ✅ Readiness endpoint exists at `/api/health/ready`
   - ✅ Liveness always returns 200 (unless critical failure)
   - ✅ Readiness returns 503 when dependencies down
   - ✅ Liveness and readiness have different response structures

3. **Issue #3: Timeout Handling** (`issue3-timeout-handling.spec.ts`)
   - ✅ Product Service calls timeout after 5 seconds
   - ✅ Health check calls timeout after 2 seconds
   - ✅ Timeout errors are properly categorized
   - ✅ Health check returns 503 on timeout
   - ✅ Timeout errors include proper error messages

4. **Issue #4: Resource Monitoring** (`issue4-resource-monitoring.spec.ts`)
   - ✅ Health check includes memory usage
   - ✅ Health check includes cart count
   - ✅ Returns unhealthy when memory > 80%
   - ✅ Returns degraded when cart count > 10,000
   - ✅ Resource metrics have proper units and percentages

5. **Issue #5: Error Handling** (`issue5-error-handling.spec.ts`)
   - ✅ Network errors are properly categorized
   - ✅ HTTP 500 errors are categorized as SERVER_ERROR
   - ✅ HTTP 404 errors are categorized as NOT_FOUND
   - ✅ Connection refused errors are categorized
   - ✅ Error messages are descriptive and actionable

6. **Issue #6: Caching Mechanism** (`issue6-caching.spec.ts`)
   - ✅ Health check results are cached for 30 seconds
   - ✅ Subsequent calls within 30s return cached result
   - ✅ Cache expires after 30 seconds
   - ✅ Cache can be manually invalidated
   - ✅ Liveness cache (60s) and readiness cache (30s) are separate

7. **Issue #7: Docker Health Check** (`issue7-docker-health.spec.ts`)
   - ✅ Docker health check endpoint responds
   - ✅ Health check works with wget command
   - ✅ Health check respects start_period
   - ✅ Health check retries on failure
   - ✅ Container marked unhealthy after retries exhausted

8. **Issue #8: Observability** (`issue8-observability.spec.ts`)
   - ✅ Health response includes version
   - ✅ Health response includes uptime
   - ✅ Health response includes response time
   - ✅ Health response includes detailed checks
   - ✅ Health response includes timestamp

9. **Integration Workflow** (`integration-workflow.spec.ts`)
   - ✅ End-to-end health check flow
   - ✅ API Gateway can check Cart Service health
   - ✅ Cart Service validates Product Service
   - ✅ Health check works in Docker Compose
   - ✅ Orchestration uses readiness endpoint

### Manual Verification

#### 1. Docker Compose Health Checks
```bash
# Start services
docker-compose up -d

# Check health status
docker-compose ps

# Verify cart-service shows "healthy"
docker inspect cart-service | grep -A 10 Health

# Stop Product Service
docker-compose stop product-service

# Verify cart-service shows "unhealthy" (readiness)
docker-compose ps

# Verify liveness still healthy
curl http://localhost:3002/api/health/live
```

#### 2. Kubernetes Deployment (if applicable)
```yaml
# Example Kubernetes deployment with probes
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3002
  initialDelaySeconds: 40
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3002
  initialDelaySeconds: 20
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

#### 3. API Gateway Integration
```bash
# Test API Gateway health check
curl http://localhost:3000/api/health

# Verify Cart Service is included in response
# Verify status reflects Cart Service health
```

#### 4. Performance Testing
```bash
# Install autocannon (load testing tool)
npm install -g autocannon

# Test health check performance
autocannon -c 100 -d 30 http://localhost:3002/api/health

# Verify response time < 2 seconds
# Verify no errors under load
```

---

## Implementation Order

### Phase 1: Setup Test Framework (Day 1-2)
1. Create test project structure
2. Install Playwright and dependencies
3. Create base API classes
4. Create Page Object Models
5. Setup test configuration
6. Write failing tests (TDD approach)

### Phase 2: Implement Core Health Check (Day 3-5)
1. Create `health-check.service.ts`
2. Implement dependency validation
3. Implement resource monitoring
4. Implement caching mechanism
5. Add liveness and readiness methods
6. Run tests - verify some pass

### Phase 3: Update Product Client (Day 6-7)
1. Add timeout configuration
2. Add health check method
3. Improve error categorization
4. Update error handling
5. Run tests - verify more pass

### Phase 4: Update Routes (Day 8-9)
1. Replace `/api/health` endpoint
2. Add `/api/health/live` endpoint
3. Add `/api/health/ready` endpoint
4. Update Swagger documentation
5. Run tests - verify most pass

### Phase 5: Update Types and Infrastructure (Day 10-11)
1. Add new TypeScript types
2. Update `docker-compose.yml`
3. Update `Dockerfile`
4. Update Swagger schemas
5. Run tests - verify all pass

### Phase 6: Integration Testing (Day 12-13)
1. Test Docker Compose health checks
2. Test API Gateway integration
3. Test under load
4. Test failure scenarios
5. Verify all manual tests pass

### Phase 7: Documentation and Cleanup (Day 14-15)
1. Update README files
2. Add inline code comments
3. Generate test reports
4. Create deployment guide
5. Final review and sign-off

---

## Risk Mitigation

### Risk 1: Breaking Changes to Health Endpoint

**What's Changing:**
- Health endpoint response structure (additional fields)
- HTTP status codes (503 for unhealthy vs always 200)

**Potential Impact:**
- Monitoring systems expecting old format may break
- Alerting rules may need updates

**Mitigation Strategy:**
- Add new fields while keeping existing fields
- Maintain backward compatibility for 1 sprint
- Communicate changes to ops team
- Update monitoring dashboards before deployment

**Rollback Plan:**
- Keep old health endpoint as `/api/health/legacy`
- Feature flag to switch between old and new
- Gradual migration over 2 weeks

### Risk 2: Health Check Performance

**What's Changing:**
- Health check now calls Product Service
- Additional resource monitoring

**Potential Impact:**
- Slower health check response times
- Increased load on Product Service

**Mitigation Strategy:**
- Implement 30-second caching
- Set aggressive timeouts (2 seconds)
- Monitor health check response times
- Load test before production

**Rollback Plan:**
- Disable dependency checks via environment variable
- Fall back to simple liveness check

### Risk 3: Docker Compose Dependency Issues

**What's Changing:**
- `depends_on` now uses `condition: service_healthy`
- Requires Product Service health check

**Potential Impact:**
- Cart Service won't start if Product Service unhealthy
- Longer startup times

**Mitigation Strategy:**
- Add `start_period: 40s` to allow startup time
- Ensure Product Service has health check
- Test startup order thoroughly

**Rollback Plan:**
- Remove `condition: service_healthy`
- Use simple `depends_on` without condition

### Risk 4: In-Memory Cart Data Loss

**What's Changing:**
- Liveness/readiness separation may cause restarts

**Potential Impact:**
- Container restarts lose all cart data
- Users lose shopping carts

**Mitigation Strategy:**
- Liveness check very permissive (rarely fails)
- Only readiness check validates dependencies
- Document in-memory limitation
- Consider adding cart persistence in future

**Rollback Plan:**
- Disable liveness probe
- Only use readiness probe
- Increase failure threshold

---

## Success Criteria

### Code Quality
- ✅ All TypeScript types properly defined
- ✅ No `any` types used
- ✅ All functions have JSDoc comments
- ✅ Code follows existing style guide
- ✅ No linting errors

### Test Coverage
- ✅ 30+ test cases written
- ✅ All identified issues have tests
- ✅ All tests pass
- ✅ Test reports generated (HTML + JSON)
- ✅ Integration tests pass

### Functionality
- ✅ Health check validates Product Service
- ✅ Liveness endpoint always returns 200 (unless critical)
- ✅ Readiness endpoint returns 503 when unhealthy
- ✅ Timeouts configured (5s Product Service, 2s health)
- ✅ Resource monitoring included (memory, carts)
- ✅ Caching implemented (30s readiness, 60s liveness)

### Infrastructure
- ✅ Docker health check configured
- ✅ docker-compose.yml updated
- ✅ Dockerfile includes HEALTHCHECK
- ✅ Health checks work in Docker Compose
- ✅ Proper HTTP status codes (200, 503)

### Documentation
- ✅ Swagger documentation updated
- ✅ README files updated
- ✅ Inline code comments added
- ✅ Test documentation complete
- ✅ Deployment guide created

### Performance
- ✅ Health check responds in < 2 seconds
- ✅ No performance degradation under load
- ✅ Caching reduces dependency load
- ✅ Timeouts prevent hanging

---

## Next Steps

1. **Review this implementation plan** with team
2. **Get approval** for breaking changes
3. **Setup test framework** (Phase 1)
4. **Write failing tests** (TDD approach)
5. **Implement changes** (Phases 2-5)
6. **Run tests** and verify all pass
7. **Manual testing** (Phase 6)
8. **Documentation** (Phase 7)
9. **Deploy to staging**
10. **Monitor and validate**
11. **Deploy to production**

---

**Plan Created:** 2026-01-23T08:58:16+13:00  
**Status:** ✅ Ready for Review  
**Next Artifact:** Test Framework Implementation
