import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class OrderAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  async createOrder(userId: string, orderData: any): Promise<APIResponse> {
    return this.post(`/api/orders/${userId}`, orderData);
  }

  async getUserOrders(userId: string): Promise<APIResponse> {
    return this.get(`/api/orders/${userId}`);
  }

  async getOrder(userId: string, orderId: string): Promise<APIResponse> {
    return this.get(`/api/orders/${userId}/${orderId}`);
  }

  async updateOrderStatus(userId: string, orderId: string, status: string): Promise<APIResponse> {
    return this.put(`/api/orders/${userId}/${orderId}/status`, { status });
  }

  async cancelOrder(userId: string, orderId: string): Promise<APIResponse> {
    return this.post(`/api/orders/${userId}/${orderId}/cancel`, {});
  }

  async getHealth(): Promise<APIResponse> {
    return this.get('/api/orders/health');
  }
}
