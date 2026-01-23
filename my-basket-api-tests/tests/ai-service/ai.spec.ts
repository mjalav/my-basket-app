import { test, expect } from '../../src/fixtures/api-fixtures';

test.describe('AI Service API Tests', () => {
  const userId = 'ai-test-user';

  test('should get grocery suggestions based on items', async ({ aiApi }) => {
    const items = ['milk', 'bread'];
    const response = await aiApi.getGrocerySuggestions(items);
    await aiApi.assertStatus(response, 200);
    
    const body = await response.json();
    expect(body.suggestions).toBeDefined();
    expect(Array.isArray(body.suggestions)).toBeTruthy();
  });

  test('should get personalized recommendations for user', async ({ aiApi }) => {
    const response = await aiApi.getPersonalizedRecommendations(userId);
    await aiApi.assertStatus(response, 200);
    
    const body = await response.json();
    expect(body.suggestions).toBeDefined();
    expect(Array.isArray(body.suggestions)).toBeTruthy();
  });

  test.describe('Negative Testing', () => {
    test('should handle empty items list for suggestions', async ({ aiApi }) => {
      const response = await aiApi.getGrocerySuggestions([]);
      // Should either return empty suggestions or 400 depending on implementation
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.suggestions).toBeDefined();
    });

    test('should handle invalid payload format gracefully', async ({ aiApi }) => {
      const response = await aiApi.post('/api/recommendations/grocery-suggestions', { invalid: 'data' } as any);
      // AI service defaults to empty list and returns 200
      expect(response.status()).toBe(200);
    });
  });
});
