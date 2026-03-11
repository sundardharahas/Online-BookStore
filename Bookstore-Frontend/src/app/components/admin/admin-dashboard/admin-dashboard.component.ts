import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  currentAdmin: any = null;

  stats = {
    totalBooks: 0,
    totalCategories: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockBooks: 0
  };

  recentOrders: any[] = [];
  currentTime: Date = new Date();
  isLoading = true;
  sidebarCollapsed = false;

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.currentAdmin = this.adminAuthService.getCurrentAdmin();
    this.loadDashboardData();

    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  // =========================
  // REAL-TIME DASHBOARD DATA
  // =========================
  loadDashboardData(): void {
    this.isLoading = true;

    this.dashboardService.getDashboardData().subscribe({
      next: (data: any) => {
        console.log("FULL DASHBOARD DATA:", data);
      console.log("BOOKS RESPONSE:", data.books);
      console.log("ORDERS RESPONSE:", data.orders);

        const books: any[] = data?.books || [];
        const orders: any[] = data?.orders || [];

        // BOOK STATS
        this.stats.totalBooks = books.length;
        this.stats.totalCategories =
          new Set(books.map((b: any) => b.category)).size;

        this.stats.lowStockBooks =
          books.filter((b: any) => b.stock <= 10).length;

        // ORDER STATS
        this.stats.totalOrders = orders.length;

        this.stats.pendingOrders =
          orders.filter((o: any) => o.status?.toLowerCase() === 'pending').length;

        this.stats.totalRevenue =
          orders
            .filter((o: any) => o.paymentStatus?.toLowerCase() === 'paid')
            .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

        // RECENT ORDERS
        this.recentOrders = orders
          .sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Dashboard load error:', err);
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.adminAuthService.logout();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getGreeting(): string {
    const hour = this.currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/admin/orders']);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // =========================
  // ADD THESE MISSING METHODS
  // =========================

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'status-pending',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };

    return classes[status?.toLowerCase()] || 'status-pending';
  }

  getPaymentClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'payment-pending',
      paid: 'payment-paid',
      failed: 'payment-failed',
      refunded: 'payment-refunded'
    };

    return classes[status?.toLowerCase()] || 'payment-pending';
  }
}