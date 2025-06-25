"use client";

import Link from "next/link";
import { ShoppingCart, Package, HomeIcon, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiCart } from "@/hooks/useApiCart";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { totalCartItems } = useApiCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            MyBasket Lite
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" className="text-sm font-medium">
              <HomeIcon className="mr-2 h-4 w-4" />
              Products
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost" className="text-sm font-medium">
              <Receipt className="mr-2 h-4 w-4" />
              My Orders
            </Button>
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/cart">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalCartItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
                >
                  {totalCartItems}
                </Badge>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
