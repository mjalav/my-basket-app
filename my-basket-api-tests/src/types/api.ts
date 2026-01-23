export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  image: string;
  dataAiHint: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface CartSummary {
  userId: string;
  totalItems: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services?: Record<string, any>;
}
