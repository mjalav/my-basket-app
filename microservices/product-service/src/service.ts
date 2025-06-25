import { Product, ProductFilters, PaginationParams, ProductResponse } from './types';
import { sampleProducts } from './data';

export class ProductService {
  private products: Product[] = sampleProducts;

  async getAllProducts(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<ProductResponse> {
    let filteredProducts = [...this.products];

    // Apply filters
    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter(
          (product) => product.category === filters.category
        );
      }
      
      if (filters.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(
          (product) => product.price >= filters.minPrice!
        );
      }
      
      if (filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(
          (product) => product.price <= filters.maxPrice!
        );
      }
      
      if (filters.inStock !== undefined) {
        filteredProducts = filteredProducts.filter(
          (product) => product.inStock === filters.inStock
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.dataAiHint.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProducts.length / limit);

    return {
      products: paginatedProducts,
      total: filteredProducts.length,
      page,
      limit,
      totalPages,
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) || null;
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(), // In real app, use proper UUID
      createdAt: new Date(),
      updatedAt: new Date(),
      inStock: productData.inStock ?? true,
    };
    
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const productIndex = this.products.findIndex((product) => product.id === id);
    
    if (productIndex === -1) {
      return null;
    }
    
    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.products[productIndex];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const productIndex = this.products.findIndex((product) => product.id === id);
    
    if (productIndex === -1) {
      return false;
    }
    
    this.products.splice(productIndex, 1);
    return true;
  }

  async getCategories(): Promise<string[]> {
    const categories = [...new Set(this.products.map((product) => product.category).filter(Boolean))];
    return categories as string[];
  }
}
