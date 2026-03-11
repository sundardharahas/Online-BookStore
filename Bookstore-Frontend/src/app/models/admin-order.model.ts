export interface AdminOrder {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: Date;
  items: OrderItem[];
  shippingAddress: Address;
}

export interface OrderItem {
  bookId: number;
  bookTitle: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}