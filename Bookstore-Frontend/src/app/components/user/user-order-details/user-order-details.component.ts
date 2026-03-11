import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-user-order-details',
  templateUrl: './user-order-details.component.html',
  styleUrls: ['./user-order-details.component.css']
})
export class UserOrderDetailsComponent implements OnInit {

  orderId: number = 0;
  order: Order | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = +id;
        this.loadOrderDetails();
      } else {
        this.router.navigate(['/orders']);
      }
    });
  }

  loadOrderDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching order details:', err);
        this.errorMessage = 'Failed to load order details. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  getStatusBadgeClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending': return 'badge bg-warning text-dark';
      case 'processing': return 'badge bg-info text-dark';
      case 'shipped': return 'badge bg-primary';
      case 'delivered': return 'badge bg-success';
      case 'cancelled': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending': return 'fa-clock';
      case 'processing': return 'fa-cogs';
      case 'shipped': return 'fa-shipping-fast';
      case 'delivered': return 'fa-check-circle';
      case 'cancelled': return 'fa-times-circle';
      default: return 'fa-info-circle';
    }
  }

  getPaymentMethodText(method: string): string {
    if (!method) return 'Unknown';
    switch(method.toLowerCase()) {
      case 'card': return 'Credit/Debit Card';
      case 'cod': return 'Cash on Delivery';
      case 'paypal': return 'PayPal';
      default: return method.charAt(0).toUpperCase() + method.slice(1);
    }
  }
}
