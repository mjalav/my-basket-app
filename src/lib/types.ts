export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  dataAiHint: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
}
