import { OrderReviewClient } from "@/components/checkout/OrderReviewClient";

export default function CheckoutPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8 text-center">
        Checkout
      </h1>
      <OrderReviewClient />
    </div>
  );
}
