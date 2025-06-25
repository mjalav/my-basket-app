import axios from 'axios';

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3002';

export class CartServiceClient {
  async clearCart(userId: string): Promise<void> {
    try {
      await axios.delete(`${CART_SERVICE_URL}/api/cart/${userId}`);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  async getCart(userId: string): Promise<any> {
    try {
      const response = await axios.get(`${CART_SERVICE_URL}/api/cart/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error('Failed to fetch cart');
    }
  }
}
