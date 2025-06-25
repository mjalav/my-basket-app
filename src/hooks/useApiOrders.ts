"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { getUserId } from "@/lib/session";
import type { Order } from "@/lib/types";

export const useApiOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      const ordersData = await apiClient.getOrders(userId) as { orders: Order[] };
      setOrders(ordersData.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch orders on hook initialization
  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refreshOrders: fetchOrders,
  };
};
