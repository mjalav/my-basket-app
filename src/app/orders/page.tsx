import { OrderHistoryClient } from "@/components/orders/OrderHistoryClient";

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
        Your Orders
      </h1>
      <OrderHistoryClient />
    </div>
  );
}
