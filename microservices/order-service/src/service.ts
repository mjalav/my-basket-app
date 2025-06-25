import { Order, OrderStatus, CreateOrderRequest, UpdateOrderStatusRequest, OrderFilters, PaginationParams, OrderResponse } from './types';
import { CartServiceClient } from './cart-client';
import { v4 as uuidv4 } from 'uuid';

export class OrderService {
  private orders: Map<string, Order[]> = new Map(); // userId -> orders
  private cartClient: CartServiceClient;

  constructor() {
    this.cartClient = new CartServiceClient();
  }

  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const totalAmount = orderData.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );

    const order: Order = {
      id: uuidv4(),
      userId,
      items: orderData.items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: OrderStatus.PENDING,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
      orderDate: new Date(),
      estimatedDelivery: this.calculateEstimatedDelivery(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userOrders = this.orders.get(userId) || [];
    userOrders.unshift(order); // Add to beginning for newest first
    this.orders.set(userId, userOrders);

    // Clear the user's cart after successful order creation
    try {
      await this.cartClient.clearCart(userId);
    } catch (error) {
      console.warn('Failed to clear cart after order creation:', error);
    }

    return order;
  }

  async getOrderById(userId: string, orderId: string): Promise<Order | null> {
    const userOrders = this.orders.get(userId) || [];
    return userOrders.find(order => order.id === orderId) || null;
  }

  async getUserOrders(
    userId: string,
    filters?: OrderFilters,
    pagination?: PaginationParams
  ): Promise<OrderResponse> {
    let userOrders = this.orders.get(userId) || [];

    // Apply filters
    if (filters) {
      if (filters.status) {
        userOrders = userOrders.filter(order => order.status === filters.status);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        userOrders = userOrders.filter(order => order.orderDate >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        userOrders = userOrders.filter(order => order.orderDate <= endDate);
      }
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedOrders = userOrders.slice(startIndex, endIndex);
    const totalPages = Math.ceil(userOrders.length / limit);

    return {
      orders: paginatedOrders,
      total: userOrders.length,
      page,
      limit,
      totalPages,
    };
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    updateData: UpdateOrderStatusRequest
  ): Promise<Order | null> {
    const userOrders = this.orders.get(userId) || [];
    const orderIndex = userOrders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return null;
    }

    const order = userOrders[orderIndex];
    
    // Validate status transition
    if (!this.isValidStatusTransition(order.status, updateData.status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${updateData.status}`);
    }

    order.status = updateData.status;
    order.updatedAt = new Date();

    if (updateData.trackingNumber) {
      order.trackingNumber = updateData.trackingNumber;
    }

    if (updateData.estimatedDelivery) {
      order.estimatedDelivery = new Date(updateData.estimatedDelivery);
    }

    if (updateData.actualDelivery) {
      order.actualDelivery = new Date(updateData.actualDelivery);
    }

    this.orders.set(userId, userOrders);
    return order;
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order | null> {
    const userOrders = this.orders.get(userId) || [];
    const orderIndex = userOrders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return null;
    }

    const order = userOrders[orderIndex];

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel order that has already been shipped or delivered');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error('Order is already cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();

    this.orders.set(userId, userOrders);
    return order;
  }

  private calculateEstimatedDelivery(): Date {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from now
    return deliveryDate;
  }

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
