"use client";

import { useCart } from "@/hooks/useCart";
import { OrderItemCard } from "./OrderItemCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Receipt } from "lucide-react";

export function OrderHistoryClient() {
  const { orders } = useCart(); // orders are loaded from localStorage via CartContext

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">You haven't placed any orders. Start shopping to see your orders here.</p>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/">Shop Now</Link>
        </Button>
      </div>
    );
  }

  // Display orders, newest first
  const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {sortedOrders.map((order) => (
        <OrderItemCard key={order.id} order={order} />
      ))}
    </div>
  );
}
