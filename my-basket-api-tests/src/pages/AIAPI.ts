import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class AIAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  async getGrocerySuggestions(items: string[]): Promise<APIResponse> {
    return this.post('/api/recommendations/grocery-suggestions', { items });
  }

  async getPersonalizedRecommendations(userId: string): Promise<APIResponse> {
    return this.post('/api/recommendations/personalized', { userId });
  }

  async getHealth(): Promise<APIResponse> {
    return this.get('/api/recommendations/health');
  }
}
