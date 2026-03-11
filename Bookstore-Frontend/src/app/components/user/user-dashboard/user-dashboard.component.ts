import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { BookService } from '../../../services/book.service';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { Book } from '../../../models/book.model';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  recommendations: Book[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';
  searchQuery: string = '';
  cartCount: number = 0;
  userName: string = 'Reader';
  isLoading: boolean = true;
  errorMessage: string = '';
  bookRatings: { [bookId: number]: { avg: number; count: number } } = {};
  addedToCartSet: Set<number> = new Set();
  addedToWishlistSet: Set<number> = new Set();

  constructor(
    public userAuthService: UserAuthService,
    private bookService: BookService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private reviewService: ReviewService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userName = this.userAuthService.getUserName();
    this.loadRecommendations();
    this.loadBooks();

    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
  }

  loadBooks(): void {
    this.isLoading = true;
    this.bookService.getAllBooks().subscribe({
      next: (response: any) => {
        console.log('Books:', response);

        const books = response.books || response.data || response;

        this.books = books;
        this.filteredBooks = books;
        this.extractCategories();
        this.loadRatings([...this.books, ...this.recommendations]);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.errorMessage = 'Error loading books. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadRecommendations(): void {
    this.bookService.getRecommendations().subscribe({
      next: (books: Book[]) => {
        this.recommendations = books;
      },
      error: (error) => {
        console.error('Error loading recommendations:', error);
      }
    });
  }

  extractCategories(): void {
    const categorySet = new Set<string>();
    this.books.forEach(book => {
      if (book.category) {
        categorySet.add(book.category);
      }
    });
    this.categories = Array.from(categorySet).slice(0, 6);
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredBooks = this.books;
    } else {
      this.filteredBooks = this.books.filter(book => book.category === category);
    }
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    if (query.trim() === '') {
      this.filterByCategory(this.selectedCategory);
    } else {
      this.bookService.searchBooks(query).subscribe({
        next: (books) => {
          this.filteredBooks = books;
        }
      });
    }
  }

  addToCart(bookId: number): void {
    if (this.addedToCartSet.has(bookId)) return;
    this.cartService.addToCart(bookId, 1).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification('Book added to cart!', 'success');
          this.addedToCartSet.add(bookId);
        }
        this.loadRatings([...this.books, ...this.recommendations]);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.showNotification('Failed to add to cart', 'error');
      }
    });
  }

  /**
   * FIXED: Pass book.id instead of entire book object
   */
  addToWishlist(book: Book): void {
    // Check if book has an id
    if (!book.id) {
      this.showNotification('Invalid book', 'error');
      return;
    }

    this.wishlistService.addToWishlist(book.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showNotification('Book added to wishlist!', 'success');
          this.addedToWishlistSet.add(book.id);
        } else {
          this.showNotification(response.message || '', 'error');
        }
      },
      error: (error) => {
        console.error('Error adding to wishlist:', error);
        this.showNotification('Failed to add to wishlist', 'error');
      }
    });
  }

  /**
   * Check if book is in wishlist
   */
  isInWishlist(bookId: number): boolean {
    return this.addedToWishlistSet.has(bookId);
  }

  viewBookDetails(bookId: number): void {
    this.router.navigate(['/book', bookId]);
  }

  scrollToBooks(): void {
    document.getElementById('booksSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  showAllCategories(): void {
    // In a real app, this would open a modal with all categories
    alert('All categories would be displayed here');
  }

  loadRatings(books: Book[]): void {
    const uniqueBookIds = [...new Set(books.map(b => b.id))];
    uniqueBookIds.forEach(id => {
      // Only load if not already loaded
      if (!this.bookRatings[id] && id) {
        this.reviewService.getBookReviews(id).subscribe({
          next: (res) => {
            if (res) {
              this.bookRatings[id] = {
                avg: res.averageRating || 0,
                count: res.totalReviews || 0
              };
            }
          },
          error: () => {
            // Silently ignore errors for individual ratings and avoid retrying
            this.bookRatings[id] = { avg: 0, count: 0 };
          }
        });
      }
    });
  }

  getStockStatus(stock: number): { class: string; text: string } {
    if (stock === 0) {
      return { class: 'out-of-stock', text: 'Out of Stock' };
    } else if (stock < 5) {
      return { class: 'low-stock', text: 'Low Stock' };
    }
    return { class: 'in-stock', text: 'In Stock' };
  }

  getCoverImage(book: Book): string {
    if (book.coverImage && book.coverImage.trim() !== '') {
      return book.coverImage;
    }
    return ''; // Will use default cover
  }

  truncateDescription(description?: string, maxLength: number = 150): string {
    if (!description) return 'No description available';

    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    // This would use a notification service
    console.log(`${type}: ${message}`);
  }

  getTotalBooks(): number {
    return this.books.length;
  }
}