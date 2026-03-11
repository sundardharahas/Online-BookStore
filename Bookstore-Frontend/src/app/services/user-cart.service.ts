import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { AddToCartResponse } from '../models/user-book.model';

@Injectable({
  providedIn: 'root'
})
export class UserCartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    this.loadCartCount();
  }

  private loadCartCount(): void {
    const cart = this.getCartFromStorage();
    this.cartCountSubject.next(cart.length);
  }

  private getCartFromStorage(): any[] {
    const cartStr = localStorage.getItem('cart');
    return cartStr ? JSON.parse(cartStr) : [];
  }

  private saveCartToStorage(cart: any[]): void {
    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartCountSubject.next(cart.length);
  }

  getCartCount(): Observable<number> {
    return this.cartCount$;
  }

  addToCart(bookId: number): Observable<AddToCartResponse> {
    const cart = this.getCartFromStorage();
    
    // Check if item already exists
    const existingItem = cart.find(item => item.bookId === bookId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        bookId: bookId,
        quantity: 1,
        addedAt: new Date()
      });
    }
    
    this.saveCartToStorage(cart);
    
    return of({
      success: true,
      cartCount: cart.length
    });
  }

  removeFromCart(bookId: number): Observable<AddToCartResponse> {
    let cart = this.getCartFromStorage();
    cart = cart.filter(item => item.bookId !== bookId);
    this.saveCartToStorage(cart);
    
    return of({
      success: true,
      cartCount: cart.length
    });
  }

  clearCart(): void {
    localStorage.removeItem('cart');
    this.cartCountSubject.next(0);
  }
}