import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CartItem, CartSummary, CartResponse, UpdateQuantityRequest } from '../models/cart.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();
  private cartSummarySubject = new BehaviorSubject<CartSummary>({
    itemCount: 0,
    subtotal: 0,
    shipping: 5,
    shippingDiscount: 0,
    tax: 0,
    total: 0,
    hasFreeShipping: false
  });
  public cartSummary$ = this.cartSummarySubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load cart items from API
   */
  loadCart(userId: number = 1): void {
    this.getCart(userId).subscribe({
      next: (response) => {
        if (response.success && response.cart) {
          this.cartSubject.next(response.cart);
          const totalItems = response.cart.reduce(
  (sum, item) => sum + item.quantity,
  0
);

this.cartCountSubject.next(totalItems);
          this.calculateSummary(response.cart);
        }
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  /**
   * Get cart items from API
   * Fixed: Added userId parameter to match backend API
   */
  getCart(userId: number = 1): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Add item to cart
   * Fixed: Added userId parameter to match backend expectations
   */
  addToCart(bookId: number, quantity: number = 1, userId: number = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.apiUrl, {
      userId: userId,
      bookId: bookId,
      quantity: quantity
    }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart(userId); // Reload cart after add with userId
        }
      })
    );
  }

  /**
   * Update item quantity
   */
  updateQuantity(updateData: UpdateQuantityRequest): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/${updateData.cartId}`, updateData).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart(); // Reload cart after update
        }
      })
    );
  }

  /**
   * Remove item from cart
   * Fixed: Removed bookId parameter and query string
   */
  removeFromCart(cartId: number): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/${cartId}`).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart(); // Reload cart after remove
        }
      })
    );
  }

  /**
   * Clear entire cart
   * Note: This may need userId if backend expects it
   */
  clearCart(userId: number = 1): Observable<CartResponse> {
    // Adjust this based on your backend API
    // Option 1: If backend expects userId
    // return this.http.delete<CartResponse>(`${this.apiUrl}/user/${userId}`);
    
    // Option 2: If backend clears by cartId
    // return this.http.delete<CartResponse>(`${this.apiUrl}/${cartId}`);
    
    // Option 3: If backend clears all for user (adjust as needed)
    return this.http.delete<CartResponse>(`${this.apiUrl}/clear/${userId}`).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart(userId);
        }
      })
    );
  }

  /**
   * Calculate cart summary
   */
  private calculateSummary(cart: CartItem[]): void {
    const itemCount = cart.length;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const hasFreeShipping = subtotal > 50;
    const shipping = hasFreeShipping ? 0 : 5;
    const shippingDiscount = hasFreeShipping ? 5 : 0;
    const tax = subtotal * 0.10; // 10% tax
    const total = subtotal + shipping + tax;

    const summary: CartSummary = {
      itemCount,
      subtotal,
      shipping,
      shippingDiscount,
      tax,
      total,
      hasFreeShipping
    };

    this.cartSummarySubject.next(summary);
  }

  /**
   * Check if item is in stock
   */
  isInStock(stock: number): boolean {
    return stock > 0;
  }

  /**
   * Get stock status class
   */
  getStockStatus(stock: number): { class: string; text: string; icon: string } {
    if (stock === 0) {
      return { class: 'out-of-stock', text: 'Out of Stock', icon: 'times-circle' };
    } else if (stock < 5) {
      return { class: 'low-stock', text: 'Low Stock', icon: 'exclamation-circle' };
    }
    return { class: 'in-stock', text: 'In Stock', icon: 'check-circle' };
  }

  /**
   * Get stock message
   */
  getStockMessage(stock: number): string {
    if (stock > 0 && stock < 10) {
      return `Only ${stock} left`;
    } else if (stock >= 10) {
      return 'In Stock';
    } else {
      return 'Out of Stock';
    }
  }
}