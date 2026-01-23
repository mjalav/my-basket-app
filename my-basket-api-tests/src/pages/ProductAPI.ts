import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class ProductAPI extends BaseAPI {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  async getAllProducts(params?: any): Promise<APIResponse> {
    return this.get('/api/products', { params });
  }

  async getProduct(id: string): Promise<APIResponse> {
    return this.get(`/api/products/${id}`);
  }

  async createProduct(data: any): Promise<APIResponse> {
    return this.post('/api/products', data);
  }

  async updateProduct(id: string, data: any): Promise<APIResponse> {
    return this.put(`/api/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<APIResponse> {
    return this.delete(`/api/products/${id}`);
  }

  async getCategories(): Promise<APIResponse> {
    return this.get('/api/categories');
  }

  async getHealth(): Promise<APIResponse> {
    return this.get('/api/products/health');
  }
}
