# Pull Request: Cart Service Resilience & Observability Overhaul

## 🌿 Branch Details
- **Branch Name**: `feature/cart-service-health-and-resilience`

## 📝 Overview
This PR introduces a robust health monitoring ecosystem for the **Cart Service**, significantly improving its reliability in distributed environments. It includes a new health diagnostic service, enhanced dependency management, a dedicated Playwright API testing framework, and infrastructure-level orchestration support.

---

## 🚀 Changes & Rationales

### 📦 Logic & API Enhancements (Cart Service)

#### [NEW] [health-check.service.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/health-check.service.ts)
- **What**: Implements a centralized health logic engine with dependency checks, resource monitoring (Node heap), and business metrics (Cart count).
- **Why**: Centralizing this logic ensures consistency across all health endpoints (`/live`, `/ready`, `/health`) and allows for optimized caching (30s) to protect downstream services from excessive monitoring traffic.

#### [MODIFY] [product-client.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/product-client.ts)
- **What**: Added Axios timeouts (5s default, 2s for health) and improved error categorization.
- **Why**: Prevents "zombie" requests from hanging the event loop if the Product Service is slow. Categorizing errors allows for more descriptive health reports (e.g., distinguishing between a `TIMEOUT` and `CONNECTION_REFUSED`).

#### [MODIFY] [routes.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/routes.ts)
- **What**: Added `/api/health/live`, `/api/health/ready`, and updated `/api/health`.
- **Why**: Enables proper cloud-native orchestration. `/live` tells the system if the process is running; `/ready` tells the system if it's safe to receive traffic (all dependencies up). This prevents unnecessary restart loops during transient network issues.

#### [MODIFY] [types.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/types.ts) & [swagger.ts](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/src/swagger.ts)
- **What**: Defined explicit health response interfaces and exposed them via Swagger UI.
- **Why**: Establishes a strict contract for monitoring tools and improves developer experience by making the health status easy to debug.

---

### 🐳 Infrastructure & Tooling

#### [MODIFY] [docker-compose.yml](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/docker-compose.yml)
- **What**: Implemented service-level health checks and `condition: service_healthy` dependencies.
- **Why**: Ensures that the Cart Service doesn't attempt to initialize its connections until the Product Service is fully operational, preventing startup errors and data inconsistencies.

#### [MODIFY] [Dockerfile](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/microservices/cart-service/Dockerfile)
- **What**: Added `wget` and the `HEALTHCHECK` instruction.
- **Why**: Allows Docker Engine to natively monitor the container status, enabling automatic restarts and more accurate `docker ps` reporting.

#### [MODIFY] [package.json](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/package.json) (Root)
- **What**: Added `eslint` and `eslint-config-next`.
- **Why**: Standardizing linting across the workspace to maintain code quality as the project grows.

#### [MODIFY] [README.md](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/README.md) (Root)
- **What**: Updated with documentation for new health endpoints, automated testing instructions, and updated architectural map.
- **Why**: Ensures that the new architectural improvements and testing framework are discoverable and usable by other developers and contributors.

---

### 🧪 Quality Assurance & Evidence

#### [NEW] [cart-service-api-tests/](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/cart-service-api-tests/)
- **What**: A comprehensive Playwright API testing framework with 32+ automated tests.
- **Why**: Provides automated validation of every "Issue" identified in the QA review, ensuring that the health check system itself is reliable and hasn't introduced regressions.

#### [NEW] [Assignments/](file:///d:/Personal/AI%20Course/daily-challenge/lesson1/my-basket-app/Assignments/)
- **What**: Detailed logs of prompts used and preliminary reports generated during the task.
- **Why**: Provides a complete audit trail of the AI-collaborative development process and design decisions made during the sprint.

---

## 💬 Recommended Commit Messages
1. `feat(infra): add docker health checks and service-level dependencies`
2. `feat(cart-service): implement HealthCheckService and separate liveness/readiness routes`
3. `fix(cart-service): add Axios timeouts and categorized error handling to Product Client`
4. `test(qa): introduce Playwright API test suite for Cart Service reliability`
5. `docs(qa): add Assignments folder and update root README with testing instructions`
6. `chore(workspace): update root package.json with ESLint configurations`

## 🧪 Verification
- **Automated**: All 32 Playwright tests passing in the `dev` environment.
- **Manual**: Verified Swagger UI endpoints and Docker container `healthy` status via CLI.
