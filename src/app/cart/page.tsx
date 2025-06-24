import { CartView } from "@/components/cart/CartView";

export default function CartPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
        Your Shopping Cart
      </h1>
      <CartView />
    </div>
  );
}
