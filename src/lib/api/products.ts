import { apiClient } from './client';
import type { Product } from '../types';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductService {
  async getProducts(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<ProductResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ProductResponse>(endpoint);
  }

  async getProduct(id: string): Promise<Product> {
    return apiClient.get<Product>(`/api/products/${id}`);
  }

  async getCategories(): Promise<{ categories: string[] }> {
    return apiClient.get<{ categories: string[] }>('/api/categories');
  }
}

export const productService = new ProductService();
