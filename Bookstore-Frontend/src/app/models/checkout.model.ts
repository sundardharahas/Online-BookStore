export interface CartItem {
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  itemTotal: number;
  stock: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

export interface PaymentDetails {
  method: 'cod' | 'upi' | 'card';
  upiId?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  cardName?: string;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  hasFreeShipping: boolean;
  items: CartItem[];
}

export interface PlaceOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentDetails?: PaymentDetails;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface PlaceOrderResponse {
  success: boolean;
  orderId?: number;
  orderNumber?: string;
  message?: string;
}