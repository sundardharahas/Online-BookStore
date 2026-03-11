import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order, OrderStats, OrderResponse, CancelOrderResponse } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // ==================== USER METHODS ====================

  /**
   * Get user orders with optional filter
   */
  getOrders(userId: number, filter?: string): Observable<Order[]> {
    let params = new HttpParams();
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/user/${userId}`, { params }).pipe(
      map(response => {
        console.log('Orders response:', response);
        let orders = response.orders || [];
        if (filter && filter !== 'all') {
          orders = orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());
        }
        return orders;
      })
    );
  }

  /**
   * Get order by ID
   */
  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<{success: boolean, order: Order}>(`${this.apiUrl}/${orderId}`).pipe(
      map(response => response.order)
    );
  }

  /**
   * Cancel an order
   */
  cancelOrder(orderId: number): Observable<CancelOrderResponse> {
    return this.http.post<CancelOrderResponse>(`${this.apiUrl}/${orderId}/cancel`, {});
  }

  /**
   * Get order statistics from orders array (for user view)
   */
  getUserOrderStats(orders: Order[]): OrderStats {
    const totalOrders = orders.length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const totalSpent = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    return { totalOrders, deliveredCount, totalSpent };
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get all orders (admin) with optional filters
   */
  getAllOrders(filters?: any): Observable<Order[]> {
    let params = new HttpParams();
    
    if (filters?.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }
    
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    
    if (filters?.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/admin/all`, { params }).pipe(
      map(response => {
        console.log('Admin orders response:', response);
        return response.orders || [];
      })
    );
  }

  /**
   * Get order statistics (admin)
   */
  getAdminOrderStats(): Observable<OrderStats> {
    return this.http.get<OrderStats>(`${this.apiUrl}/admin/stats`);
  }

  /**
   * Update order status (admin)
   */
  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}/status`, { status: newStatus });
  }

  /**
   * Update order details (admin)
   */
  updateOrder(orderData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderData.orderId}`, orderData);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get status icon class
   */
  getStatusIcon(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending': return 'fa-clock';
      case 'processing': return 'fa-cogs';
      case 'shipped': return 'fa-shipping-fast';
      case 'delivered': return 'fa-check-circle';
      case 'cancelled': return 'fa-times-circle';
      default: return 'fa-clock';
    }
  }

  /**
   * Get step icon
   */
  getStepIcon(stepIndex: number): string {
    switch(stepIndex) {
      case 0: return 'clock';
      case 1: return 'cogs';
      case 2: return 'shipping-fast';
      case 3: return 'check-circle';
      default: return 'circle';
    }
  }

  /**
   * Get payment method text
   */
  getPaymentMethodText(method: string): string {
    if (!method) return 'Unknown';
    
    switch(method.toLowerCase()) {
      case 'card': return 'Credit Card';
      case 'cod': return 'Cash on Delivery';
      case 'paypal': return 'PayPal';
      case 'stripe': return 'Stripe';
      case 'razorpay': return 'Razorpay';
      default: return method.charAt(0).toUpperCase() + method.slice(1);
    }
  }

  /**
   * Get status class for styling
   */
  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending': return 'order-pending';
      case 'processing': return 'order-processing';
      case 'shipped': return 'order-shipped';
      case 'delivered': return 'order-delivered';
      case 'cancelled': return 'order-cancelled';
      default: return '';
    }
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  /**
   * Get payment badge class
   */
  getPaymentBadgeClass(paymentStatus: string): string {
    switch(paymentStatus?.toLowerCase()) {
      case 'pending': return 'payment-pending';
      case 'paid': return 'payment-paid';
      case 'failed': return 'payment-failed';
      case 'refunded': return 'payment-refunded';
      default: return '';
    }
  }

  /**
   * Get current step for order progress
   */
  getCurrentStep(status: string): number {
    switch(status?.toLowerCase()) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  }
}