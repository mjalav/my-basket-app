import { ProductList } from "@/components/products/ProductList";
import { productService } from "@/lib/api";
import type { Product } from "@/lib/types";

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Timeout wrapper for API calls
async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`API call timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

export default async function HomePage() {
  let products: Product[];
  let showWarning = false;

  try {
    // Server-side rendering with 5-second timeout
    const response = await fetchWithTimeout(
      productService.getProducts({}, { limit: 20 }),
      5000
    );
    products = response.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    showWarning = true;
    
    // Fallback to static data
    const { sampleProducts } = await import("@/data/sample-products");
    products = sampleProducts;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8 text-center">
        Welcome to MyBasket Lite!
      </h1>
      {showWarning && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Note: Using fallback data. Microservices may not be running.
        </div>
      )}
      <ProductList products={products} />
    </div>
  );
}
