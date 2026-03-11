import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service';
import { WishlistItem, WishlistStats } from '../../../models/user-wishlist.model';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-wishlist',
  templateUrl: './user-wishlist.component.html',
  styleUrls: ['./user-wishlist.component.css']
})
export class UserWishlistComponent implements OnInit, OnDestroy {
  wishlistItems: WishlistItem[] = [];
  wishlistStats: WishlistStats = {
    totalItems: 0,
    currentlyReading: 0,
    completedReads: 0
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
  addedToCartSet: Set<number> = new Set();

  private subscriptions: Subscription[] = [];

  constructor(
    private wishlistService: WishlistService,
    private userAuthService: UserAuthService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadWishlistData();

    // Subscribe to wishlist count updates
    this.subscriptions.push(
      this.wishlistService.wishlistCount$.subscribe(count => {
        this.wishlistCount = count;
        this.wishlistStats.totalItems = count;
      })
    );

    // Subscribe to cart count updates
    this.subscriptions.push(
      this.cartService.cartCount$.subscribe(count => {
        this.cartCount = count;
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

  loadWishlistData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // First load wishlist stats
    this.wishlistService.getWishlistStats().subscribe({
      next: (stats) => {
        this.wishlistStats = stats;
      },
      error: (error) => {
        console.error('Error loading wishlist stats:', error);
        // Don't show error for stats, just use defaults
      }
    });

    // Load wishlist items
    this.wishlistService.getWishlist().subscribe({
      next: (items) => {
        this.wishlistItems = items;
        this.wishlistStats.totalItems = items.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        this.errorMessage = error.error?.message || 'Failed to load wishlist. Please try again.';
        this.isLoading = false;
        this.wishlistItems = [];
      }
    });
  }

  /**
   * Remove item from wishlist
   */
  removeFromWishlist(item: WishlistItem): void {
    if (!confirm(`Remove "${item.book.title}" from your wishlist?`)) {
      return;
    }

    this.removingItemId = item.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.wishlistService.removeFromWishlist(item.book.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove item from local array
          this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
          this.wishlistStats.totalItems = this.wishlistItems.length;
          this.showNotification(`${item.book.title} removed from wishlist`, 'info');
          this.removingItemId = null;
        } else {
          this.showNotification(response.message || 'Failed to remove item', 'error');
          this.removingItemId = null;
        }
      },
      error: (error) => {
        console.error('Error removing from wishlist:', error);
        this.showNotification(error.error?.message || 'Error removing item', 'error');
        this.removingItemId = null;
      }
    });
  }

  /**
   * Add item to cart and optionally remove from wishlist
   */
  addToCart(item: WishlistItem): void {
    if (!item.book.id) {
      this.showNotification('Invalid book', 'error');
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.cartService.addToCart(item.book.id, 1).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification(`${item.book.title} added to cart!`, 'success');
          this.addedToCartSet.add(item.book.id);

          // Optional: Ask if they want to remove from wishlist
          if (confirm(`${item.book.title} added to cart. Remove from wishlist?`)) {
            this.removeFromWishlist(item);
          }
        } else {
          this.showNotification(response.message || 'Failed to add to cart', 'error');
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.showNotification(error.error?.message || 'Error adding to cart', 'error');
      }
    });
  }

  /**
   * Navigate to book details
   */
  viewBookDetails(bookId: number): void {
    this.router.navigate(['/book', bookId]);
  }

  /**
   * Navigate to browse page to add more books
   */
  browseBooks(): void {
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

    // Use the same base URL as your backend
    return `${environment.apiUrl.replace('/api', '')}/${coverImage}`;
  }

  /**
   * Refresh wishlist data
   */
  refreshWishlist(): void {
    this.wishlistService.refreshWishlist();
    this.loadWishlistData();
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const iconClass = type === 'success' ? 'fa-check-circle' :
      type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle';

    notification.innerHTML = `<i class="fas ${iconClass} me-2"></i>${message}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'linear-gradient(to right, #1E3A8A, #14B8A6)' :
        type === 'info' ? 'linear-gradient(to right, #8B5CF6, #7C3AED)' :
          'linear-gradient(to right, #EF4444, #DC2626)'};
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 1000;
      font-weight: 500;
      display: flex;
      align-items: center;
      animation: slideIn 0.3s ease;
      max-width: 350px;
      border-left: 4px solid ${type === 'success' ? '#10B981' : type === 'info' ? '#8B5CF6' : '#DC2626'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Logout
   */
  logout(): void {
    this.userAuthService.logout();
    this.router.navigate(['/login']);
  }
}