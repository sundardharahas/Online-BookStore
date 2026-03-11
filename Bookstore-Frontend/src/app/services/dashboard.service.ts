import { Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BookService } from './book.service';
import { OrderService } from './order.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private bookService: BookService,
    private orderService: OrderService
  ) {}

  getDashboardData() {
    return forkJoin({
      books: this.bookService.getBooks(),
      orders: this.orderService.getAllOrders()
    });
  }
}