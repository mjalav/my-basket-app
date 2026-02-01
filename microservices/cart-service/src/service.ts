import { Cart, CartItem, Product, CartSummary } from './types';
import { ProductServiceClient } from './product-client';
import { v4 as uuidv4 } from 'uuid';

export class CartService {
  private carts: Map<string, Cart> = new Map();
  private productClient: ProductServiceClient;

  constructor(productClient?: ProductServiceClient) {
    this.productClient = productClient || new ProductServiceClient();
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = this.carts.get(userId);
    
    if (!cart) {
      cart = {
        id: uuidv4(),
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carts.set(userId, cart);
    }
    
    return cart;
  }

  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<Cart> {
    const product = await this.productClient.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const cart = await this.getOrCreateCart(userId);
    const existingItemIndex = cart.items.findIndex(item => item.id === productId);

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      const cartItem: CartItem = {
        ...product,
        quantity,
        addedAt: new Date(),
      };
      cart.items.push(cartItem);
    }

    this.updateCartTotals(cart);
    cart.updatedAt = new Date();
    this.carts.set(userId, cart);

    return cart;
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter(item => item.id !== productId);
    
    this.updateCartTotals(cart);
    cart.updatedAt = new Date();
    this.carts.set(userId, cart);

    return cart;
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId);
    }

    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex(item => item.id === productId);

    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    this.updateCartTotals(cart);
    cart.updatedAt = new Date();
    this.carts.set(userId, cart);

    return cart;
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    cart.updatedAt = new Date();
    this.carts.set(userId, cart);

    return cart;
  }

  async getCart(userId: string): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);
    return {
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      itemCount: cart.items.length,
    };
  }

  private updateCartTotals(cart: Cart): void {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.totalAmount = Math.round(cart.totalAmount * 100) / 100; // Round to 2 decimal places
  }
}
