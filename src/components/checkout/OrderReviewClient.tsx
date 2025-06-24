"use client";

import { useCart } from "@/hooks/useCart";
import type { CartItem, Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, CheckCircle } from "lucide-react";
import { useState } from "react";

export function OrderReviewClient() {
  const { items, cartTotalAmount, dispatch } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast({
        title: "Cannot place order",
        description: "Your cart is empty.",
        variant: "destructive",
      });
      return;
    }

    const newOrder: Order = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2, 9), // Simple unique ID
      date: new Date().toISOString(),
      items: [...items], // Create a copy of items
      totalAmount: cartTotalAmount,
    };

    dispatch({ type: "PLACE_ORDER", payload: newOrder });
    setIsOrderPlaced(true);

    toast({
      title: "Order Placed!",
      description: "Thank you for your purchase. Your order has been successfully placed.",
      className: "bg-green-500 text-white", // A success specific style for toast
    });
    // setTimeout(() => router.push("/orders"), 2000); // Redirect after a delay
  };

  if (isOrderPlaced) {
    return (
       <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <CheckCircle className="h-24 w-24 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
          Order Placed Successfully!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your purchase. You can view your order details in your order history.
        </p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/orders">View My Orders</Link>
        </Button>
      </div>
    )
  }
  

  if (items.length === 0 && !isOrderPlaced) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add items to your cart to proceed with checkout.</p>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Review Your Order</CardTitle>
          <CardDescription>Please check your items and total before placing the order.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {items.map((item: CartItem) => (
              <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-md">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    data-ai-hint={item.dataAiHint}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-medium text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <p className="text-md font-semibold text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${cartTotalAmount.toFixed(2)}</span>
            </div>
             <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Shipping</span>
              <span>Free</span>
            </div>
            <Separator/>
            <div className="flex justify-between font-bold text-xl text-primary">
              <span>Total</span>
              <span>${cartTotalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handlePlaceOrder} 
            className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={items.length === 0}
          >
            Place Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
