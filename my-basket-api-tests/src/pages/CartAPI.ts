import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class CartAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  async getCart(userId: string): Promise<APIResponse> {
    return this.get(`/api/cart/${userId}`);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<APIResponse> {
    return this.post(`/api/cart/${userId}/items`, { productId, quantity });
  }

  async updateItem(userId: string, productId: string, quantity: number): Promise<APIResponse> {
    return this.put(`/api/cart/${userId}/items/${productId}`, { quantity });
  }

  async removeItem(userId: string, productId: string): Promise<APIResponse> {
    return this.delete(`/api/cart/${userId}/items/${productId}`);
  }

  async clearCart(userId: string): Promise<APIResponse> {
    return this.delete(`/api/cart/${userId}`);
  }

  async getSummary(userId: string): Promise<APIResponse> {
    return this.get(`/api/cart/${userId}/summary`);
  }

  async getHealth(): Promise<APIResponse> {
    return this.get('/api/cart/health');
  }

  async getLiveness(): Promise<APIResponse> {
    return this.get('/api/cart/health/live');
  }

  async getReadiness(): Promise<APIResponse> {
    return this.get('/api/cart/health/ready');
  }
}
