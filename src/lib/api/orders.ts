import { apiClient } from './client';
import type { Order, CartItem } from '../types';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
}

export interface CreateOrderRequest {
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
}

export interface OrderResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

export interface OrderPaginationParams {
  page?: number;
  limit?: number;
}

export class OrderService {
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>(`/api/orders/${userId}`, orderData);
  }

  async getOrders(
    userId: string,
    filters?: OrderFilters,
    pagination?: OrderPaginationParams
  ): Promise<OrderResponse> {
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
    const endpoint = `/api/orders/${userId}${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<OrderResponse>(endpoint);
  }

  async getOrder(userId: string, orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/api/orders/${userId}/${orderId}`);
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    return apiClient.post<Order>(`/api/orders/${userId}/${orderId}/cancel`);
  }
}

export const orderService = new OrderService();
