import { apiClient } from './client';
import type { CartItem, Product } from '../types';

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}

export class CartService {
  async getCart(userId: string): Promise<Cart> {
    return apiClient.get<Cart>(`/api/cart/${userId}`);
  }

  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<Cart> {
    return apiClient.post<Cart>(`/api/cart/${userId}/items`, {
      productId,
      quantity,
    });
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    return apiClient.put<Cart>(`/api/cart/${userId}/items/${productId}`, {
      quantity,
    });
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    return apiClient.delete<Cart>(`/api/cart/${userId}/items/${productId}`);
  }

  async clearCart(userId: string): Promise<Cart> {
    return apiClient.delete<Cart>(`/api/cart/${userId}`);
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    return apiClient.get<CartSummary>(`/api/cart/${userId}/summary`);
  }
}

export const cartService = new CartService();
