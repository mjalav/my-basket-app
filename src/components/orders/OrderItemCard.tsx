import type { Order, CartItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface OrderItemCardProps {
  order: Order;
}

export function OrderItemCard({ order }: OrderItemCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle className="text-xl mb-1 sm:mb-0">Order #{order.id.substring(0, 8)}</CardTitle>
          <Badge variant="outline" className="border-primary text-primary bg-primary/10 w-fit">
            {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
        <CardDescription>
          Placed on {new Date(order.date).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-medium mb-2 text-foreground">Items:</p>
        <ul className="space-y-3 mb-4">
          {order.items.map((item: CartItem) => (
            <li key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
              <div className="flex items-center space-x-3">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                      data-ai-hint={item.dataAiHint}
                    />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground">{item.name}</span>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
        <div className="w-full flex justify-between items-center">
          <span className="text-lg font-semibold text-muted-foreground">Total Amount:</span>
          <span className="text-xl font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
