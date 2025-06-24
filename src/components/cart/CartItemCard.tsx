"use client";

import Image from "next/image";
import type { CartItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();

  const handleRemoveItem = () => {
    dispatch({ type: "REMOVE_ITEM", payload: item.id });
    toast({
      title: "Item removed",
      description: `${item.name} has been removed from your cart.`,
      variant: "destructive",
    });
  };

  return (
    <Card className="flex items-center p-4 space-x-4 shadow-sm">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
          data-ai-hint={item.dataAiHint}
        />
      </div>
      <CardContent className="flex flex-1 flex-col justify-between p-0">
        <div>
          <h3 className="text-md font-medium text-foreground">{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            Quantity: {item.quantity}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-md font-semibold text-primary">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveItem}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Remove item</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
