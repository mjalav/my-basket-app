"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { getUserId } from "@/lib/session";

interface ApiCartItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  dataAiHint: string;
  category: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  quantity: number;
  addedAt: string;
}

interface Cart {
  id: string;
  userId: string;
  items: ApiCartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export const useApiCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      const cartData = await apiClient.getCart(userId) as Cart;
      setCart(cartData);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      const updatedCart = await apiClient.addToCart(userId, productId, quantity) as Cart;
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      const updatedCart = await apiClient.updateCartItem(userId, productId, quantity) as Cart;
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cart item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      const updatedCart = await apiClient.removeFromCart(userId, productId) as Cart;
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      await apiClient.clearCart(userId);
      setCart(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch cart on hook initialization
  useEffect(() => {
    fetchCart();
  }, []);

  return {
    cart,
    loading,
    error,
    totalCartItems: cart?.totalItems || 0,
    totalAmount: cart?.totalAmount || 0,
    items: cart?.items || [],
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
  };
};
