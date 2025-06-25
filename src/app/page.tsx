import { ProductList } from "@/components/products/ProductList";
import { productService } from "@/lib/api";

export default async function HomePage() {
  try {
    // Fetch products from the microservice
    const response = await productService.getProducts({}, { limit: 20 });
    const products = response.products;

    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8 text-center">
          Welcome to MyBasket Lite!
        </h1>
        <ProductList products={products} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Fallback to static data if microservice is unavailable
    const { sampleProducts } = await import("@/data/sample-products");
    
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8 text-center">
          Welcome to MyBasket Lite!
        </h1>
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Note: Using fallback data. Microservices may not be running.
        </div>
        <ProductList products={sampleProducts} />
      </div>
    );
  }
}
