import axios from 'axios';
import { Product } from './types';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

export class ProductServiceClient {
  private readonly timeout = 5000;
  private readonly healthCheckTimeout = 2000;

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/health`, {
        timeout: this.healthCheckTimeout,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const response = await axios.get<Product>(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
        timeout: this.timeout,
      });
      return response.data as Product;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Product service timeout');
      }
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  async getProducts(productIds: string[]): Promise<Product[]> {
    try {
      const promises = productIds.map(id => this.getProduct(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<Product> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }
}
