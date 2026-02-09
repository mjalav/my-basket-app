/**
 * Cart Service API - Security Testing
 * Adapted to Cart API endpoints (test plan had generic endpoints).
 * Generated from api-test-reports/cart-service-api-test-plan.md
 */
import { test, expect } from '@playwright/test';

test.describe('Security Testing', () => {
  const baseUrl = 'http://localhost:3002/api/';

  test('SQL injection-like payload in userId - sanitized or rejected', async ({ request }) => {
    const maliciousUserId = "'; DROP TABLE users; --";
    const response = await request.get(`${baseUrl}cart/${encodeURIComponent(maliciousUserId)}`);
    // API should return 200 (treat as opaque id) or 400 (reject invalid)
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('userId');
    }
  });

  test('XSS-like payload in request body - sanitized or rejected', async ({ request }) => {
    const response = await request.post(`${baseUrl}cart/security-user/items`, {
      data: { productId: '<script>alert("xss")</script>', quantity: 1 },
    });
    // Expect 400 (invalid) or 404 (product not found), not execution
    expect([400, 404]).toContain(response.status());
  });

  test('Unknown route returns 404', async ({ request }) => {
    const response = await request.get(`${baseUrl}unknown-route`);
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
