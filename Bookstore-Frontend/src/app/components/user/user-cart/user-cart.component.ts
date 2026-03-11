import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { CartItem, CartSummary } from '../../../models/cart.model';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-cart',
  templateUrl: './user-cart.component.html',
  styleUrls: ['./user-cart.component.css']
})
export class UserCartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartSummary: CartSummary = {
    itemCount: 0,
    subtotal: 0,
    shipping: 5,
    shippingDiscount: 0,
    tax: 0,
    total: 0,
    hasFreeShipping: false
  };
  
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  
  // User data
  cartCount = 0;
  wishlistCount = 0;
  userInitial = 'U';
  userEmail = '';
  
  // Removing item state
  removingItemId: number | null = null;
  updatingItemId: number | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private userAuthService: UserAuthService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCartData();
    
    // Subscribe to cart updates
    this.subscriptions.push(
      this.cartService.cart$.subscribe(items => {
        this.cartItems = items;
      }),
      
      this.cartService.cartCount$.subscribe(count => {
        this.cartCount = count;
      }),
      
      this.cartService.cartSummary$.subscribe(summary => {
        this.cartSummary = summary;
      }),
      
      this.wishlistService.wishlistCount$.subscribe(count => {
        this.wishlistCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserData(): void {
    const user = this.userAuthService.getCurrentUser();
    if (user) {
      this.userInitial = user.email?.charAt(0).toUpperCase() || 'U';
      this.userEmail = user.email || '';
    }
  }

  loadCartData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.cartService.getCart().subscribe({
      next: (response) => {
        if (response.success && response.cart) {
          this.cartItems = response.cart;
          if (response.summary) {
            this.cartSummary = response.summary;
          } else {
             const itemCount = this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
             const subtotal = this.cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
             const hasFreeShipping = subtotal > 50;
             const shipping = hasFreeShipping ? 0 : 5;
             const tax = subtotal * 0.10;
             this.cartSummary = { 
               itemCount, subtotal, shipping, 
               shippingDiscount: hasFreeShipping ? 5 : 0, 
               tax, total: subtotal + shipping + tax, hasFreeShipping 
             };
          }
        } else {
          this.errorMessage = response.message || 'Failed to load cart';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.errorMessage = error.error?.message || 'Error loading cart. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Update quantity with +/-
   */
  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1 || newQuantity > item.stock) {
      if (newQuantity < 1) {
        this.showNotification('Quantity must be at least 1', 'warning');
      } else {
        this.showNotification(`Maximum stock available: ${item.stock}`, 'warning');
      }
      return;
    }
    
    this.updatingItemId = item.cartId;
    
    this.cartService.updateQuantity({
      cartId: item.cartId,
      bookId: item.bookId,
      quantity: newQuantity
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local item
          item.quantity = newQuantity;
          item.itemTotal = item.price * newQuantity;
          this.showNotification('Quantity updated', 'success', 2000);
        } else {
          this.showNotification(response.message || 'Failed to update quantity', 'error');
        }
        this.updatingItemId = null;
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        this.showNotification(error.error?.message || 'Error updating quantity', 'error');
        this.updatingItemId = null;
      }
    });
  }

  /**
   * Update quantity from input
   */
  onQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    let newQuantity = parseInt(input.value);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
      input.value = '1';
    } else if (newQuantity > item.stock) {
      newQuantity = item.stock;
      input.value = item.stock.toString();
      this.showNotification(`Maximum stock available: ${item.stock}`, 'warning');
    }
    
    if (newQuantity === item.quantity) return;
    
    this.updatingItemId = item.cartId;
    
    this.cartService.updateQuantity({
      cartId: item.cartId,
      bookId: item.bookId,
      quantity: newQuantity
    }).subscribe({
      next: (response) => {
        if (response.success) {
          item.quantity = newQuantity;
          item.itemTotal = item.price * newQuantity;
          this.showNotification('Quantity updated', 'success', 2000);
        } else {
          this.showNotification(response.message || 'Failed to update quantity', 'error');
        }
        this.updatingItemId = null;
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        this.showNotification(error.error?.message || 'Error updating quantity', 'error');
        this.updatingItemId = null;
      }
    });
  }

  /**
   * Remove item from cart
   */
  removeFromCart(item: CartItem): void {
    if (!confirm(`Remove "${item.title}" from your cart?`)) {
      return;
    }
    
    this.removingItemId = item.cartId;
    
    this.cartService.removeFromCart(item.cartId).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove item from local array
          this.cartItems = this.cartItems.filter(i => i.cartId !== item.cartId);
          this.showNotification(`${item.title} removed from cart`, 'success');
          this.removingItemId = null;
        } else {
          this.showNotification(response.message || 'Failed to remove item', 'error');
          this.removingItemId = null;
        }
      },
      error: (error) => {
        console.error('Error removing from cart:', error);
        this.showNotification(error.error?.message || 'Error removing item', 'error');
        this.removingItemId = null;
      }
    });
  }

  /**
   * Add to wishlist
   */
  addToWishlist(item: CartItem): void {
    if (!confirm(`Add "${item.title}" to your wishlist?`)) {
      return;
    }
    
    this.wishlistService.addToWishlist(item.bookId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification('Book added to wishlist!', 'success');
        } else {
          if (response.message === 'already_in_wishlist') {
            this.showNotification('This book is already in your wishlist', 'warning');
          } else {
            this.showNotification(response.message || 'Failed to add to wishlist', 'error');
          }
        }
      },
      error: (error) => {
        console.error('Error adding to wishlist:', error);
        this.showNotification(error.error?.message || 'Error adding to wishlist', 'error');
      }
    });
  }

  /**
   * Proceed to checkout
   */
  checkout(): void {
    // Check for out of stock items
    const outOfStockItems = this.cartItems.filter(item => item.stock === 0);
    if (outOfStockItems.length > 0) {
      this.showNotification('Please remove out-of-stock items before checkout', 'warning');
      return;
    }
    
    // Check for low stock items
    const lowStockItems = this.cartItems.filter(item => item.stock > 0 && item.stock < 5);
    if (lowStockItems.length > 0) {
      if (!confirm('Some items are low in stock. Continue to checkout?')) {
        return;
      }
    }
    
    this.router.navigate(['/checkout']);
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/browse']);
  }

  /**
   * Get cover image URL
   */
  getCoverImage(coverImage?: string): string {
    if (!coverImage) return '';
    
    if (coverImage.startsWith('http')) {
      return coverImage;
    }
    
    return `${environment.apiUrl.replace('/api', '')}/${coverImage}`;
  }

  /**
   * Get stock status
   */
  getStockStatus(stock: number): { class: string; text: string; icon: string } {
    return this.cartService.getStockStatus(stock);
  }

  /**
   * Get stock message
   */
  getStockMessage(stock: number): string {
    return this.cartService.getStockMessage(stock);
  }

  /**
   * Format price
   */
  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number = 3000): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    
    let alertClass, iconClass, title;
    
    switch(type) {
      case 'success':
        alertClass = 'success';
        iconClass = 'check-circle';
        title = 'Success!';
        break;
      case 'warning':
        alertClass = 'warning';
        iconClass = 'exclamation-triangle';
        title = 'Warning!';
        break;
      case 'error':
        alertClass = 'danger';
        iconClass = 'times-circle';
        title = 'Error!';
        break;
      default:
        alertClass = 'info';
        iconClass = 'info-circle';
        title = 'Info!';
    }
    
    notification.className = `custom-notification alert alert-${alertClass}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      border: none;
      border-radius: 10px;
      animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="fas fa-${iconClass} me-3 fs-4"></i>
        <div>
          <strong>${title}</strong>
          <div>${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation keyframes if not exists
    if (!document.getElementById('notification-keyframes')) {
      const style = document.createElement('style');
      style.id = 'notification-keyframes';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove after duration
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, duration);
  }

  

  /**
   * Logout
   */
  logout(): void {
    this.userAuthService.logout();
    this.router.navigate(['/login']);
  }
}