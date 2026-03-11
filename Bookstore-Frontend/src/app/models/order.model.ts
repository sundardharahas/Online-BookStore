export interface Order {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: string;
  createdAt: Date;
  itemCount: number;
  
  // Additional properties for admin view
  customerName?: string;
  customerEmail?: string;
  items?: OrderItem[];
  trackingNumber?: string;
  adminNotes?: string;
}

export interface OrderItem {
  bookId: number;
  bookTitle: string;
  quantity: number;
  price: number;
  subtotal: number;
  coverImage?: string;
}

export interface OrderStats {
  totalOrders: number;
  deliveredCount: number;
  totalSpent: number;
  
  // Admin stats
  pendingCount?: number;
  processingCount?: number;
  shippedCount?: number;
  cancelledCount?: number;
  totalRevenue?: number;
}

export interface OrderResponse {
  success: boolean;
  orders: Order[];
  total?: number;
  message?: string;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
}