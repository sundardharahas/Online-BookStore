import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem, PlaceOrderRequest, PlaceOrderResponse } from '../models/checkout.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Place an order
   */
  placeOrder(orderData: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(`${this.apiUrl}/checkout`, orderData);
  }

  /**
   * Get cart items for checkout
   */
  getCartItems(userId: number = 1): Observable<CartItem[]> {
    return this.http.get<any>(`${environment.apiUrl}/cart/${userId}`).pipe(
      map(response => response.success ? response.cart : [])
    );
  }

  /**
   * Validate coupon code
   */
  validateCoupon(code: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/validate-coupon/${code}`);
  }

  /**
   * Calculate shipping based on subtotal
   */
  calculateShipping(subtotal: number): number {
    return subtotal >= 50 ? 0 : 5;
  }

  /**
   * Calculate tax
   */
  calculateTax(subtotal: number, taxRate: number = 0.10): number {
    return subtotal * taxRate;
  }

  /**
   * Calculate order summary
   */
  calculateOrderSummary(items: CartItem[]): {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    hasFreeShipping: boolean;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const hasFreeShipping = subtotal >= 50;
    const shipping = hasFreeShipping ? 0 : 5;
    const tax = this.calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total,
      hasFreeShipping
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Get amount needed for free shipping
   */
  getAmountForFreeShipping(subtotal: number): number {
    return Math.max(0, 50 - subtotal);
  }
}