import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit {
  currentAdmin: any = null;
  currentTime = new Date();

  stats = {
    totalBooks: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  };

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.currentAdmin = this.adminAuthService.getCurrentAdmin();
    this.loadStats();
  }

  loadStats(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data: any) => {
        const books: any[] = data?.books || [];
        const orders: any[] = data?.orders || [];

        this.stats.totalBooks = books.length;
        this.stats.totalOrders = orders.length;
        this.stats.totalRevenue = orders
          .filter((o: any) => o.paymentStatus?.toLowerCase() === 'paid')
          .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      },
      error: (err: any) => {
        console.error('Error loading profile stats:', err);
      }
    });
  }

  getAdminInitial(): string {
    return this.currentAdmin?.name?.charAt(0)?.toUpperCase() || 'A';
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.adminAuthService.logout();
  }

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
}
