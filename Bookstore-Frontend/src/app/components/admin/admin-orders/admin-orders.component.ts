import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  stats: any = {
    totalOrders: 0,
    pendingCount: 0,
    processingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    totalRevenue: 0
  };
  
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  selectedStatus = 'all';
  filterForm: FormGroup;
  
  // Selected order for modals
  selectedOrder: Order | null = null;
  editOrderData = {
    orderId: null as number | null,
    status: '',
    paymentStatus: '',
    trackingNumber: '',
    adminNotes: ''
  };

  constructor(
    private orderService: OrderService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
  }

  toggleSidebar(): void {
    const sidebar = document.querySelector('app-admin-sidebar')?.querySelector('.admin-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
    }
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading orders:', err);
        this.errorMessage = err.error?.message || 'Error loading orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.orderService.getAdminOrderStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err: any) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      totalOrders: this.orders.length,
      pendingCount: this.orders.filter(o => o.status === 'pending').length,
      processingCount: this.orders.filter(o => o.status === 'processing').length,
      shippedCount: this.orders.filter(o => o.status === 'shipped').length,
      deliveredCount: this.orders.filter(o => o.status === 'delivered').length,
      cancelledCount: this.orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: this.orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.orders];

    // Filter by status
    if (this.selectedStatus && this.selectedStatus !== 'all') {
      result = result.filter(o => o.status === this.selectedStatus);
    }

    // Filter by search text
    const search = this.filterForm.get('search')?.value?.toLowerCase();
    if (search) {
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(search) ||
        o.customerName?.toLowerCase().includes(search) ||
        o.customerEmail?.toLowerCase().includes(search)
      );
    }

    // Filter by date range
    const dateFrom = this.filterForm.get('dateFrom')?.value;
    const dateTo = this.filterForm.get('dateTo')?.value;
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(o => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(o => new Date(o.createdAt) <= to);
    }

    this.filteredOrders = result;
  }

  resetFilters(): void {
    this.selectedStatus = 'all';
    this.filterForm.reset({
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    this.applyFilters();
  }

  openOrderDetailsModal(orderId: number): void {
    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        setTimeout(() => {
          const modalElement = document.getElementById('orderDetailsModal');
          if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement);
            modal.show();
          }
        }, 100);
      },
      error: (err: any) => {
        console.error('Error loading order details:', err);
        this.showError('Error loading order details');
      }
    });
  }

  openEditOrderModal(order: Order): void {
    this.editOrderData = {
      orderId: order.orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber || '',
      adminNotes: order.adminNotes || ''
    };
    
    setTimeout(() => {
      const modalElement = document.getElementById('editOrderModal');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 100);
  }

  closeModals(): void {
    const modalIds = ['orderDetailsModal', 'editOrderModal'];
    modalIds.forEach(modalId => {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    });
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    if (!confirm(`Are you sure you want to update this order to ${newStatus}?`)) {
      return;
    }
    
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess('Order status updated successfully');
          this.loadOrders();
          this.loadStats();
        } else {
          this.showError(response.message || 'Failed to update order');
        }
      },
      error: (err: any) => {
        console.error('Error updating order:', err);
        this.showError(err.error?.message || 'Error updating order');
      }
    });
  }

  saveOrderChanges(): void {
    if (!this.editOrderData.orderId) {
      this.showError('Invalid order data');
      return;
    }

    this.orderService.updateOrder(this.editOrderData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess('Order updated successfully');
          this.closeModals();
          this.loadOrders();
          this.loadStats();
        } else {
          this.showError(response.message || 'Failed to update order');
        }
      },
      error: (err: any) => {
        console.error('Error updating order:', err);
        this.showError(err.error?.message || 'Error updating order');
      }
    });
  }

  printInvoice(): void {
    if (!this.selectedOrder) {
      this.showError('No order selected to print');
      return;
    }
    
    const order = this.selectedOrder;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${order.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice-header { text-align: center; margin-bottom: 30px; }
              .invoice-header h1 { color: #1E3A8A; }
              .order-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th { background: #1E3A8A; color: white; padding: 10px; }
              td { border: 1px solid #ddd; padding: 8px; }
              .total-row { font-weight: bold; background: #f0f0f0; }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <h1>Smart Bookstore</h1>
              <h3>Invoice #${order.orderNumber}</h3>
            </div>
            <div class="order-info">
              <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
              <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
              <p><strong>Date:</strong> ${this.formatDate(order.createdAt)}</p>
            </div>
            <table>
              <thead><tr><th>Book</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${order.items?.map((item: any) => `
                  <tr>
                    <td>${item.bookTitle}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${item.subtotal.toFixed(2)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No items</td></tr>'}
              </tbody>
              <tfoot>
                <tr class="total-row"><td colspan="3" style="text-align:right;">Total:</td><td>$${order.totalAmount.toFixed(2)}</td></tr>
              </tfoot>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  getStatusBadgeClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status);
  }

  getPaymentBadgeClass(status: string): string {
    return this.orderService.getPaymentBadgeClass(status);
  }

  getTotalOrders(): number {
    return this.orders.length;
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

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }
}