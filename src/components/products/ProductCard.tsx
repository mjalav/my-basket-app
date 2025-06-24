"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    dispatch({ type: "ADD_ITEM", payload: product });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/2] w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={product.dataAiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">
          {product.description}
        </CardDescription>
        <p className="text-xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
