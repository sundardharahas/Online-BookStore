export interface CartItem {
  cartId: number;
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  stock: number;
  coverImage?: string;
  category?: string;
  itemTotal: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shipping: number;
  shippingDiscount: number;
  tax: number;
  total: number;
  hasFreeShipping: boolean;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data?: any;
  cart?: CartItem[];
  summary?: CartSummary;
}

export interface UpdateQuantityRequest {
  cartId: number;
  bookId: number;
  quantity: number;
}

export interface AddToCartRequest {
  bookId: number;
  quantity?: number;
}