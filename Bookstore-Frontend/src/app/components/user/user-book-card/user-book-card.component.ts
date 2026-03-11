import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

// Define the interface directly if you don't have the model file
export interface UserBook {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  coverImage?: string;
  description?: string;
  rating?: number;
}

@Component({
  selector: 'app-user-book-card',
  templateUrl: './user-book-card.component.html',
  styleUrls: ['./user-book-card.component.css']
})
export class UserBookCardComponent {
  @Input() book!: UserBook;
  @Input() index: number = 0;
  @Output() addToCartEvent = new EventEmitter<number>();
  
  addingToCart: boolean = false;

  constructor(private router: Router) {}

  /**
   * Get stock status based on book stock
   */
  getStockStatus(): { class: string; text: string } {
    // Add null check
    if (!this.book) {
      return { class: 'out-of-stock', text: 'Unknown' };
    }
    
    if (this.book.stock === 0) {
      return { class: 'out-of-stock', text: 'Out of Stock' };
    } else if (this.book.stock < 5) {
      return { class: 'low-stock', text: 'Low Stock' };
    }
    return { class: 'in-stock', text: 'In Stock' };
  }

  /**
   * Get cover image URL
   */
  getCoverImageUrl(): string {
    if (!this.book || !this.book.coverImage) {
      return '';
    }
    
    // If it's already a full URL, use it directly
    if (this.book.coverImage.startsWith('http')) {
      return this.book.coverImage;
    }
    
    // Otherwise, prepend assets path
    return `assets/${this.book.coverImage}`;
  }

  /**
   * Truncate description to specified length
   */
  truncateDescription(description: string = '', maxLength: number = 150): string {
    if (!description) {
      return 'No description available';
    }
    return description.length > maxLength 
      ? description.substring(0, maxLength) + '...' 
      : description;
  }

  /**
   * Add to cart
   */
  addToCart(): void {
    // Add null check
    if (!this.book) {
      console.error('Book is undefined');
      return;
    }
    
    if (this.book.stock === 0 || this.addingToCart) {
      return;
    }
    
    this.addingToCart = true;
    this.addToCartEvent.emit(this.book.id);
    
    // Reset loading state after 1 second
    setTimeout(() => {
      this.addingToCart = false;
    }, 1000);
  }

  /**
   * View book details
   */
  viewDetails(): void {
    if (this.book?.id) {
      this.router.navigate(['/book', this.book.id]);
    }
  }
}