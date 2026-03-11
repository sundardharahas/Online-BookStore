import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { OrderService } from '../../../services/order.service';
import { Order, OrderStats } from '../../../models/order.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.css']
})
export class UserOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedFilter: string = 'all';
  stats: OrderStats = {
    totalOrders: 0,
    deliveredCount: 0,
    totalSpent: 0
  };
  
  isLoading = true;
  errorMessage = '';
  
  // User data
  cartCount = 0;
  wishlistCount = 0;
  userInitial = 'U';
  userEmail = '';
  
  // Auto-refresh for active orders
  private refreshSubscription?: Subscription;
  readonly steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

  constructor(
    private orderService: OrderService,
    private userAuthService: UserAuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    
    // Subscribe to query params for filter
    this.route.queryParams.subscribe(params => {
      this.selectedFilter = params['filter'] || 'all';
      this.loadOrders();
    });
    
    // Subscribe to cart and wishlist counts
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
    
    this.wishlistService.wishlistCount$.subscribe(count => {
      this.wishlistCount = count;
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadUserData(): void {
    const user = this.userAuthService.getCurrentUser();
    if (user) {
      this.userInitial = user.email?.charAt(0).toUpperCase() || 'U';
      this.userEmail = user.email || '';
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Use the actual logged-in user's ID
    const user = this.userAuthService.getCurrentUser();
    const userId = user?.id || 1;
    this.orderService.getOrders(userId, this.selectedFilter).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.calculateStats();
        this.isLoading = false;
        this.setupAutoRefresh();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.errorMessage = error.error?.message || 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Replace the calculateStats method with this:
calculateStats(): void {
  this.stats = {
    totalOrders: this.orders.length,
    deliveredCount: this.orders.filter(o => o.status === 'delivered').length,
    totalSpent: this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0)
  };
}
  setupAutoRefresh(): void {
    // Check if there are any pending or processing orders
    const hasActiveOrders = this.orders.some(o => 
      o.status === 'pending' || o.status === 'processing'
    );
    
    if (hasActiveOrders && document.hasFocus()) {
      // Refresh every minute if there are active orders
      this.refreshSubscription = interval(60000).subscribe(() => {
        if (document.hasFocus()) {
          this.loadOrders();
        }
      });
    }
  }

  changeFilter(filter: string): void {
    this.selectedFilter = filter;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filter === 'all' ? null : filter },
      queryParamsHandling: 'merge'
    });
  }

  cancelOrder(orderId: number): void {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Order cancelled successfully!');
          this.loadOrders(); // Reload orders
        } else {
          alert(response.message || 'Failed to cancel order');
        }
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        alert(error.error?.message || 'Server error!');
      }
    });
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/order', orderId]);
  }

  printInvoice(orderId: number): void {
    window.open(`/api/orders/${orderId}/invoice`, '_blank');
  }

  trackOrder(orderId: number): void {
    alert(`Tracking feature would open for order #${orderId}`);
  }

  browseBooks(): void {
    this.router.navigate(['/browse']);
  }

  searchBooks(): void {
    this.router.navigate(['/browse']);
  }

  getStatusClass(status: string): string {
    return this.orderService.getStatusClass(status);
  }

  getStatusBadgeClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status);
  }

  getPaymentBadgeClass(paymentStatus: string): string {
    return this.orderService.getPaymentBadgeClass(paymentStatus);
  }

  getStatusIcon(status: string): string {
    return this.orderService.getStatusIcon(status);
  }

  getPaymentMethodText(method: string): string {
    return this.orderService.getPaymentMethodText(method);
  }

  getCurrentStep(status: string): number {
    return this.orderService.getCurrentStep(status);
  }

  getStepIcon(stepIndex: number): string {
    return this.orderService.getStepIcon(stepIndex);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  logout(): void {
    this.userAuthService.logout();
    this.router.navigate(['/login']);
  }
}