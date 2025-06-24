import { ProductList } from "@/components/products/ProductList";
import { sampleProducts } from "@/data/sample-products";

export default function HomePage() {
  // In a real app, you'd fetch products from an API
  const products = sampleProducts;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8 text-center">
        Welcome to MyBasket Lite!
      </h1>
      <ProductList products={products} />
    </div>
  );
}
