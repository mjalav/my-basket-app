# RCTC Prompt: Code Refactoring & Cleanup

**ROLE**
As a Senior Software Engineer, systematically refactor code to improve maintainability, readability, and adherence to SOLID principles without changing functionality.

**CONTEXT**
-   **Project**: "MyBasket Lite" TypeScript/Next.js application
-   **Goal**: Improve code quality while preserving behavior
-   **Standards**: SOLID principles, DRY, clean code practices
-   **Safety**: All refactoring must be behavior-preserving (tests must still pass)
-   **Approach**: Incremental changes with frequent test runs

**TASK**
Refactor **[TARGET_FILE_OR_MODULE]** to:
1.  Apply SOLID principles
2.  Eliminate code duplication (DRY)
3.  Improve naming and structure
4.  Extract magic numbers and complex logic
5.  Enhance TypeScript type safety
6.  Ensure all tests still pass after refactoring

**CONSTRAINTS (Must Follow - Behavior Preserving)**

### 1. SOLID Principles (Apply Systematically)
-   **Single Responsibility**: Each class/function = one clear purpose
    -   If describing a class requires "and", it has too many responsibilities
-   **Open/Closed**: Extend behavior via inheritance/composition, not modification
-   **Liskov Substitution**: Derived classes must work where base classes are used
-   **Interface Segregation**: Small, specific interfaces > large general ones
-   **Dependency Inversion**: Depend on abstractions (interfaces), not concrete classes

### 2. Code Organization Standards
-   **Imports**: External libraries first, then internal modules, alphabetically sorted
-   **Constants**: Extract magic numbers/strings to named constants at top of file
    ```typescript
    const MAX_RETRY_ATTEMPTS = 3;
    const DEFAULT_TIMEOUT_MS = 5000;
    ```
-   **Function Size**: Keep under 20 lines; extract helper functions
-   **Remove Dead Code**: Delete unused imports, variables, commented code
-   **Grouping**: Related functions together, public methods before private

### 3. TypeScript Best Practices (Strict Mode)
-   **No `any`**: Use specific types, `unknown`, or generics
-   **Interfaces**: Define for all data structures, API requests/responses
    ```typescript
    interface Product {
      id: string;
      name: string;
      price: number;
    }
    ```
-   **Readonly**: Use for immutable data: `readonly items: CartItem[]`
-   **Const Assertions**: `const STATUS = ['active', 'pending'] as const;`
-   **Prefer `const`** over `let`; never use `var`

### 4. DRY (Don't Repeat Yourself)
-   **Extract Duplicate Logic**:
    ```typescript
    // Before: repeated calculation
    const total1 = price1 * quantity1;
    const total2 = price2 * quantity2;
    
    // After: extracted function
    const calculateTotal = (price: number, qty: number) => price * qty;
    ```
-   **Utility Functions**: Create for common operations
-   **Higher-Order Functions**: Reduce repetition with functional patterns

### 5. Function Refactoring Patterns
-   **Extract Method**: Long functions → multiple small functions
-   **Extract Boolean Function**: Complex conditions → named boolean functions
    ```typescript
    // Before
    if (user.age >= 18 && user.hasLicense && !user.isSuspended) { ... }
    
    // After
    const canDrive = (user: User) => 
      user.age >= 18 && user.hasLicense && !user.isSuspended;
    if (canDrive(user)) { ... }
    ```
-   **Early Returns**: Reduce nesting
    ```typescript
    // Before
    if (valid) {
      if (authorized) {
        // main logic
      }
    }
    
    // After
    if (!valid) return;
    if (!authorized) return;
    // main logic
    ```

### 6. Naming Conventions (Strictly Enforced)
-   **Variables/Functions**: `camelCase` - `getUserData`, `productCount`
-   **Classes/Types**: `PascalCase` - `ProductService`, `CartItem`
-   **Constants**: `UPPER_SNAKE_CASE` - `MAX_ITEMS`, `API_TIMEOUT`
-   **Booleans**: Start with `is`, `has`, `should`, `can` - `isValid`, `hasPermission`
-   **Descriptive Names**: `userAge` > `a`, `productPrice` > `p`

### 7. Error Handling (Robust)
-   **Try-Catch**: Wrap async operations
-   **Specific Errors**: Throw descriptive errors
    ```typescript
    throw new Error(`Product not found: ${productId}`);
    ```
-   **Fail Fast**: Validate inputs at function entry
-   **Context Logging**: Include relevant data in error logs

### 8. Refactoring Workflow (Safety Critical)
1.  ✅ **Run Tests Before**: Establish baseline (all tests pass)
2.  ✅ **Small Changes**: One refactoring pattern at a time
3.  ✅ **Run Tests After Each Change**: Ensure no breakage
4.  ✅ **Commit Frequently**: Save working state
5.  ✅ **No Functionality Changes**: Behavior must stay identical

## Refactoring Checklist

### Before Starting
- [ ] Ensure you have tests covering the code
- [ ] Understand the code's current behavior
- [ ] Identify the refactoring goal (what are you improving?)
- [ ] Run existing tests to establish baseline

### During Refactoring
- [ ] Make small, incremental changes
- [ ] Run tests after each change
- [ ] Commit working code frequently
- [ ] Keep functionality unchanged (behavior-preserving)

### Code Quality
- [ ] Remove all unused code (imports, variables, functions)
- [ ] Extract magic numbers to named constants
- [ ] Replace complex conditions with well-named functions
- [ ] Simplify nested if/else with early returns
- [ ] Break long functions into smaller ones
- [ ] Extract duplicate code into reusable functions
- [ ] Use TypeScript types instead of `any`
- [ ] Add missing error handling
- [ ] Improve variable/function names for clarity

### After Refactoring
- [ ] All tests still pass
- [ ] Code is more readable
- [ ] Code follows team standards
- [ ] No functionality has changed
- [ ] Performance is maintained or improved
- [ ] Documentation is updated

## Example: Before & After

### Before (Needs Refactoring)
```typescript
// Bad: Magic numbers, unclear logic, poor naming, no types
export class CartService {
  private carts: any = new Map();

  addToCart(uid: string, pid: string, q: number): any {
    let c = this.carts.get(uid);
    if (!c) {
      c = { id: generateId(), userId: uid, items: [], total: 0 };
      this.carts.set(uid, c);
    }
    
    let found = false;
    for (let i = 0; i < c.items.length; i++) {
      if (c.items[i].id === pid) {
        c.items[i].quantity += q;
        found = true;
        break;
      }
    }
    
    if (!found) {
      c.items.push({ id: pid, quantity: q });
    }
    
    // Calculate total
    let t = 0;
    for (let i = 0; i < c.items.length; i++) {
      t += c.items[i].price * c.items[i].quantity;
    }
    c.total = parseFloat(t.toFixed(2));
    
    return c;
  }
}
```

### After (Refactored)
```typescript
// Good: Clear types, named constants, extracted methods, readable
import { Cart, CartItem, Product } from './types';
import { ProductServiceClient } from './product-client';
import { v4 as uuidv4 } from 'uuid';

const PRICE_DECIMAL_PLACES = 2;

export class CartService {
  private carts: Map<string, Cart> = new Map();
  private productClient: ProductServiceClient;

  constructor(productClient?: ProductServiceClient) {
    this.productClient = productClient || new ProductServiceClient();
  }

  async addToCart(
    userId: string, 
    productId: string, 
    quantity: number = 1
  ): Promise<Cart> {
    const product = await this.fetchProduct(productId);
    const cart = this.getOrCreateCart(userId);
    
    this.addOrUpdateCartItem(cart, product, quantity);
    this.updateCartTotals(cart);
    this.updateCartTimestamp(cart);
    
    this.carts.set(userId, cart);
    return cart;
  }

  private async fetchProduct(productId: string): Promise<Product> {
    const product = await this.productClient.getProduct(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    return product;
  }

  private getOrCreateCart(userId: string): Cart {
    const existingCart = this.carts.get(userId);
    
    if (existingCart) {
      return existingCart;
    }
    
    return this.createNewCart(userId);
  }

  private createNewCart(userId: string): Cart {
    return {
      id: uuidv4(),
      userId,
      items: [],
      totalAmount: 0,
      totalItems: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private addOrUpdateCartItem(
    cart: Cart, 
    product: Product, 
    quantity: number
  ): void {
    const existingItem = this.findCartItem(cart, product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push(this.createCartItem(product, quantity));
    }
  }

  private findCartItem(cart: Cart, productId: string): CartItem | undefined {
    return cart.items.find(item => item.id === productId);
  }

  private createCartItem(product: Product, quantity: number): CartItem {
    return {
      ...product,
      quantity,
      addedAt: new Date(),
    };
  }

  private updateCartTotals(cart: Cart): void {
    const totalAmount = this.calculateTotalAmount(cart.items);
    const totalItems = this.calculateTotalItems(cart.items);
    
    cart.totalAmount = this.roundToDecimalPlaces(totalAmount, PRICE_DECIMAL_PLACES);
    cart.totalItems = totalItems;
  }

  private calculateTotalAmount(items: CartItem[]): number {
    return items.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
  }

  private calculateTotalItems(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  private roundToDecimalPlaces(value: number, places: number): number {
    return parseFloat(value.toFixed(places));
  }

  private updateCartTimestamp(cart: Cart): void {
    cart.updatedAt = new Date();
  }
}
```

## Common Refactoring Patterns

### 1. Extract Method
When a function is too long or does multiple things:
```typescript
// Before
function processOrder(order: Order) {
  // 50 lines of validation
  // 30 lines of calculation
  // 20 lines of database operations
}

// After
function processOrder(order: Order) {
  validateOrder(order);
  const total = calculateOrderTotal(order);
  saveOrderToDatabase(order, total);
}
```

### 2. Extract Constant
When magic numbers or strings appear multiple times:
```typescript
// Before
if (age >= 18 && age <= 65) { ... }
if (status === "active" || status === "pending") { ... }

// After
const MIN_AGE = 18;
const MAX_AGE = 65;
const ACTIVE_STATUSES = ['active', 'pending'] as const;

if (age >= MIN_AGE && age <= MAX_AGE) { ... }
if (ACTIVE_STATUSES.includes(status)) { ... }
```

### 3. Replace Conditional with Polymorphism
When you have type checking with different behaviors:
```typescript
// Before
function getDiscount(customer: Customer) {
  if (customer.type === 'premium') {
    return customer.orderTotal * 0.2;
  } else if (customer.type === 'regular') {
    return customer.orderTotal * 0.1;
  }
  return 0;
}

// After
interface Customer {
  getDiscount(orderTotal: number): number;
}

class PremiumCustomer implements Customer {
  getDiscount(orderTotal: number): number {
    return orderTotal * 0.2;
  }
}

class RegularCustomer implements Customer {
  getDiscount(orderTotal: number): number {
    return orderTotal * 0.1;
  }
}
```

### 4. Simplify Complex Conditionals
Extract conditions into well-named boolean functions:
```typescript
// Before
if (user.age >= 18 && user.hasValidLicense && !user.hasSuspension && user.completedTraining) {
  allowDriving();
}

// After
function canUserDrive(user: User): boolean {
  return user.isAdult() 
    && user.hasValidLicense() 
    && !user.hasSuspension 
    && user.hasCompletedTraining();
}

if (canUserDrive(user)) {
  allowDriving();
}
```

## Tools & Commands

```bash
# TypeScript type checking
npm run typecheck

# Linting
npm run lint
npm run lint -- --fix

# Format code
npx prettier --write "src/**/*.ts"

# Run tests after refactoring
npm test

# Test coverage
npm test -- --coverage
```

## Warning Signs That Code Needs Refactoring

- Functions longer than 20-30 lines
- Deeply nested conditionals (> 3 levels)
- Duplicate code in multiple places
- Unclear variable/function names
- Large classes with many responsibilities
- Functions with many parameters (> 4)
- Code that's hard to test
- Frequent bugs in the same area
- Comments explaining complex logic

## Remember

**The goal of refactoring is to make code easier to understand and modify, not to change what it does.**

Always refactor with tests in place, make small incremental changes, and verify functionality at each step.
