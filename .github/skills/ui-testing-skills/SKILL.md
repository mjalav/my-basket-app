---
name: ui-testing
description: Write Playwright UI tests for Next.js frontend in the MyBasket Lite e-commerce application. Tests interact with real running microservices to validate user workflows and product browsing features.
---

# UI Testing Skill for MyBasket Lite

## 🚀 Prerequisites: Start the Application

Before writing or running tests, the application and all microservices must be running:

### Step 1: Install Dependencies
```bash
npm install
npm run microservices:install
```

### Step 2: Start Microservices (Terminal 1)
```bash
npm run microservices:start
```

**Services will start on:**
- API Gateway: `http://localhost:3000`
- Product Service: `http://localhost:3001`
- Cart Service: `http://localhost:3002`
- Order Service: `http://localhost:3003`
- AI Service: `http://localhost:3004`

**Verify health:**
```bash
npm run microservices:health
```

### Step 3: Start Frontend (Terminal 2)
```bash
npm run dev
```

Frontend will start at: `http://localhost:9002`

### Step 4: Run Tests (Terminal 3)
```bash
npm run test:ui
```

---

## 📱 MyBasket Lite Application Overview

### Frontend Architecture
- **Framework**: Next.js 15+ with React Server Components
- **Port**: 9002
- **Entry Point**: [src/app/](../../../src/app/)
- **Components**: [src/components/](../../../src/components/) - Radix UI + shadcn components
- **State Management**: ApiCartContext (React Context) in [src/contexts/ApiCartContext.tsx](../../../src/contexts/ApiCartContext.tsx)
- **API Client**: [src/lib/api/client.ts](../../../src/lib/api/client.ts) - Wrapper around fetch with JSON handling
- **Styling**: TailwindCSS

### Available Pages

| Page | Route | File | Purpose |
|------|-------|------|---------|
| **Home** | `/` | [src/app/page.tsx](../../../src/app/page.tsx) | Product browsing, add to cart |
| **Cart** | `/cart` | [src/app/cart/page.tsx](../../../src/app/cart/page.tsx) | View/manage cart items, checkout |
| **Checkout** | `/checkout` | [src/app/checkout/page.tsx](../../../src/app/checkout/page.tsx) | Order review, payment |
| **Orders** | `/orders` | [src/app/orders/page.tsx](../../../src/app/orders/page.tsx) | Order history |

### Real Test Data

Tests use **real product data** from the Product Service (no mocking):

**Product Service Data**: [microservices/product-service/src/data.ts](../../../microservices/product-service/src/data.ts)

Available products (8 total):
1. **Organic Apples** - $3.99 (fruits)
2. **Whole Wheat Bread** - $4.49 (bakery)
3. **Free-Range Eggs** - $5.99 (dairy)
4. **Organic Spinach** - $2.99 (vegetables)
5. **Almond Milk** - $3.79 (dairy)
6. **Chicken Breast** - $9.99 (meat)
7. **Brown Rice** - $2.49 (grains)
8. **Greek Yogurt** - $4.99 (dairy)

When tests run, they fetch these products from the running Product Service via API Gateway.

---

## 🏗️ Microservices Architecture

### How Services Interconnect

```
Frontend (9002)
    ↓
API Gateway (3000) - Rate limiting, CORS, compression
    ├→ Product Service (3001) - Product catalog
    ├→ Cart Service (3002) - Shopping carts (calls Product Service)
    ├→ Order Service (3003) - Orders (calls Cart Service)
    └→ AI Service (3004) - Recommendations (Genkit-based)
```

### Key Service Details

**Product Service** (`http://localhost:3001`)
- Endpoints: `GET /api/products`, `GET /api/products/:id`
- Returns 8 sample products from [data.ts](../../../microservices/product-service/src/data.ts)
- Schema: [microservices/product-service/src/types.ts](../../../microservices/product-service/src/types.ts)
- Health check: `GET /api/health`

**Cart Service** (`http://localhost:3002`)
- Endpoints: `GET /api/cart/{userId}`, `POST /api/cart/{userId}`, `PATCH /api/cart/{userId}/items/{productId}`
- In-memory storage (resets on restart - intentional for testing)
- Calls Product Service for pricing
- Schema: [microservices/cart-service/src/types.ts](../../../microservices/cart-service/src/types.ts)

**Order Service** (`http://localhost:3003`)
- Endpoints: `POST /api/orders`, `GET /api/orders/{orderId}`
- Coordinates with Cart Service
- Creates orders from cart items
- Schema: [microservices/order-service/src/types.ts](../../../microservices/order-service/src/types.ts)

---

## 💾 State Management & API Integration

### Frontend Cart State (ApiCartContext)

Located in [src/contexts/ApiCartContext.tsx](../../../src/contexts/ApiCartContext.tsx):
- **Context Hook**: `useCart()` - Access cart state and dispatch actions
- **Actions**: 
  - `addToCart(productId, quantity)` - POST to `/api/cart`
  - `removeFromCart(productId)` - DELETE from `/api/cart`
  - `updateQuantity(productId, quantity)` - PATCH to `/api/cart`
  - `clearCart()` - Clear all items
- **State**: `{ items: CartItem[], loading: boolean, error: string | null }`

### API Endpoints (via API Gateway at `http://localhost:3000`)

**Products**:
```
GET /api/products?limit=20&page=1
→ Returns: { products: Product[], total: number, page: number, limit: number, totalPages: number }
```

**Cart** (per user):
```
GET /api/cart/{userId}
POST /api/cart/{userId} { productId, quantity }
PATCH /api/cart/{userId}/items/{productId} { quantity }
DELETE /api/cart/{userId}/items/{productId}
```

**Orders**:
```
POST /api/orders { userId, items: [...] }
GET /api/orders/{orderId}
GET /api/orders?userId={userId}
```

---

## 🧪 Test Setup Specifics

### Test File Structure

```
tests/
├── app/
│   ├── pages/
│   │   ├── home.page.ts          # Page Object for home page
│   │   ├── cart.page.ts          # Page Object for cart page
│   │   └── checkout.page.ts      # Page Object for checkout page
│   ├── home.ui.spec.ts           # Tests for home page
│   ├── cart.ui.spec.ts           # Tests for cart page
│   └── checkout.ui.spec.ts       # Tests for checkout page
├── shared/
│   ├── base.page.ts              # BasePage with common methods
│   ├── base.api.ts               # API client base class (for service testing)
│   └── common.ts                 # Shared utilities
└── tsconfig.json
```

### How to Access Product Data in Tests

**Option 1: Fetch from Running Service**
```typescript
import { test } from '@playwright/test';

test('should display products from service', async ({ request }) => {
  const response = await request.get('http://localhost:3000/api/products');
  const data = await response.json();
  
  // data.products contains the 8 real products
  expect(data.products.length).toBe(8);
});
```

**Option 2: Use Page Navigation (Real User Flow)**
```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';

test('should display products on home page', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  
  // Page loads products from API automatically
  const count = await home.getProductCount();
  expect(count).toBe(8);
});
```

### Creating Test Users/Cart Items

Since Cart Service uses in-memory storage:
1. Each test gets a fresh cart (resets between tests)
2. Add products via the frontend UI: `home.addProductToCart('Organic Apples')`
3. Or via API: `POST /api/cart/{userId} { productId: '1', quantity: 1 }`

---

## 🎯 Test Features to Validate

### Home Page (`/`)
- ✅ Display all 8 products from Product Service
- ✅ Show product details (name, price, description)
- ✅ Add product to cart (triggers API call)
- ✅ Update cart badge with item count
- ✅ Search/filter products (if implemented)
- ✅ Responsive layout (mobile, tablet, desktop)

### Cart Page (`/cart`)
- ✅ Display cart items from Cart Service
- ✅ Show total price (calculation from cart)
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Proceed to checkout

### Checkout Page (`/checkout`)
- ✅ Review order summary
- ✅ Submit order to Order Service
- ✅ Redirect to order confirmation

### Orders Page (`/orders`)
- ✅ Display user's order history
- ✅ Show order details and status

---

## 📝 Key Testing Patterns

### 1. No Mocking - Use Real Services
```typescript
// ❌ DON'T mock API responses
await page.route('**/api/products', route => {
  route.abort(); // Don't do this
});

// ✅ DO call real services
test('should fetch products from real service', async ({ page }) => {
  await page.goto('http://localhost:9002');
  // Service automatically called by frontend
});
```

### 2. Test Real User Workflows
```typescript
test('complete shopping workflow', async ({ page }) => {
  // Step 1: Browse home page
  await page.goto('http://localhost:9002');
  
  // Step 2: Add product to cart (real API call)
  await page.getByRole('button', { name: /add to cart/i }).first().click();
  
  // Step 3: Verify cart updated (real state change)
  await expect(page.getByRole('status')).toContainText('Added to cart');
  
  // Step 4: Navigate to cart
  await page.goto('http://localhost:9002/cart');
  
  // Step 5: Verify cart items from service
  const items = await page.locator('[data-testid="cart-item"]').count();
  expect(items).toBeGreaterThan(0);
});
```

### 3. Page Object Model for MyBasket Pages
```typescript
// tests/app/pages/home.page.ts
import { BasePage } from '../../shared/base.page';

export class HomePage extends BasePage {
  readonly pageTitle = 'MyBasket Lite';
  
  async goto(): Promise<void> {
    await this.page.goto('http://localhost:9002');
  }
  
  async addProductToCart(productName: string): Promise<void> {
    const card = this.page
      .locator('article')
      .filter({ hasText: productName })
      .first();
    
    await card.getByRole('button', { name: /add to cart/i }).click();
  }
  
  async getProductCount(): Promise<number> {
    return this.page.locator('article').count();
  }
}
```

---

## 🔍 Component References

### Key Frontend Components

| Component | Path | Purpose |
|-----------|------|---------|
| ProductList | [src/components/products/ProductList.tsx](../../../src/components/products/ProductList.tsx) | Renders products grid |
| ProductCard | [src/components/products/ProductCard.tsx](../../../src/components/products/ProductCard.tsx) | Individual product card with "Add to Cart" |
| CartView | [src/components/cart/CartView.tsx](../../../src/components/cart/CartView.tsx) | Cart display |
| CartItemCard | [src/components/cart/CartItemCard.tsx](../../../src/components/cart/CartItemCard.tsx) | Cart item display |
| Header | [src/components/layout/Header.tsx](../../../src/components/layout/Header.tsx) | App header with cart badge |

### Key Hooks for Testing

| Hook | File | Purpose |
|------|------|---------|
| `useCart()` | [src/hooks/useApiCart.ts](../../../src/hooks/useApiCart.ts) | Access cart state and actions |
| `useApiOrders()` | [src/hooks/useApiOrders.ts](../../../src/hooks/useApiOrders.ts) | Access orders |
| `useToast()` | [src/hooks/use-toast.ts](../../../src/hooks/use-toast.ts) | Toast notifications |

---

## 🚨 Important Notes

1. **Services Must Be Running**: Tests require all microservices to be active
2. **No Mocking**: Tests use real API responses from running services
3. **In-Memory State**: Cart data resets when Cart Service restarts (by design)
4. **Real Product Data**: 8 products in [product-service/src/data.ts](../../../microservices/product-service/src/data.ts)
5. **Test Isolation**: Each test gets fresh browser context and cart
6. **Slow Tests**: Actual API calls and network make tests slower than mocked tests (acceptable for e2e)

---

## 📚 Related Documentation

- [Playwright Intro](https://playwright.dev/docs/intro)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Project Configuration](../../../playwright.config.ts)
- [API Documentation](../../../docs/API_DOCUMENTATION.md)
- [Product Service Docs](../../../microservices/product-service/README.md)
