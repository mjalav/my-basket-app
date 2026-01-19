// Smart API URL detection for Docker environments
const getApiUrl = (): string => {
  // Client-side (browser): always use localhost
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  
  // Server-side: check if we're inside Docker container
  if (process.env.DOCKER_CONTAINER === 'true') {
    // Inside Docker: use internal service network
    return 'http://api-gateway:3000';
  }
  
  // Server-side outside Docker: use localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Cart methods
  async addToCart(userId: string, productId: string, quantity: number = 1) {
    return this.post(`/api/cart/${userId}/items`, { productId, quantity });
  }

  async getCart(userId: string) {
    return this.get(`/api/cart/${userId}`);
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    return this.put(`/api/cart/${userId}/items/${productId}`, { quantity });
  }

  async removeFromCart(userId: string, productId: string) {
    return this.delete(`/api/cart/${userId}/items/${productId}`);
  }

  async clearCart(userId: string) {
    return this.delete(`/api/cart/${userId}`);
  }

  // Product methods
  async getProducts(limit?: number, page?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (page) params.append('page', page.toString());
    return this.get(`/api/products?${params.toString()}`);
  }

  async getProduct(id: string) {
    return this.get(`/api/products/${id}`);
  }

  // Order methods
  async getOrders(userId: string) {
    return this.get(`/api/orders/${userId}`);
  }

  async createOrder(userId: string, items: any[]) {
    // Provide default shipping and billing info for demo purposes
    const orderData = {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        dataAiHint: item.dataAiHint,
        quantity: item.quantity,
      })),
      shippingAddress: {
        street: "123 Demo Street",
        city: "Demo City",
        state: "CA",
        zipCode: "12345",
        country: "USA"
      },
      billingAddress: {
        street: "123 Demo Street",
        city: "Demo City", 
        state: "CA",
        zipCode: "12345",
        country: "USA"
      },
      paymentMethod: {
        type: "credit_card" as const,
        last4: "1234",
        brand: "Demo Card"
      }
    };
    
    return this.post(`/api/orders/${userId}`, orderData);
  }

  // AI methods
  async getGrocerySuggestions(cartItems: string[]) {
    return this.post(`/api/recommendations/grocery-suggestions`, { cartItems });
  }

  async getPersonalizedRecommendations(cartItems: string[], userId?: string, maxSuggestions?: number) {
    return this.post(`/api/recommendations/personalized`, { cartItems, userId, maxSuggestions });
  }
}

export const apiClient = new ApiClient();
