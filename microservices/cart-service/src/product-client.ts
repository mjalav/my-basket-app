import axios from 'axios';
import { Product } from './types';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

export class ProductServiceClient {
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
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
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }
}
