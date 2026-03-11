import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { BrowseService } from '../../../services/browse.service';
import { Book, BrowseFilters, BrowseStats } from '../../../models/book.model';
import { environment } from '../../../../environments/environment';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-user-browse',
  templateUrl: './user-browse.component.html',
  styleUrls: ['./user-browse.component.css']
})
export class UserBrowseComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  categories: string[] = [];
  sortOptions: { value: string; label: string }[] = [];
  stats: BrowseStats = {
    totalBooks: 0,
    availableBooks: 0,
    wishlistCount: 0
  };

  isLoading = true;
  errorMessage = '';
  successMessage = '';
  bookRatings: { [bookId: number]: { avg: number; count: number } } = {};

  filterForm: FormGroup;
  selectedBook: Book | null = null;
  addedToCartSet: Set<number> = new Set();

  // User data
  userId: number = 0;
  cartCount: number = 0;
  wishlistCount: number = 0;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 12;

  constructor(
    private userAuthService: UserAuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private browseService: BrowseService,
    private reviewService: ReviewService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      category: [''],
      sortBy: ['title']
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategories();
    this.loadSortOptions();

    // Subscribe to query params
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        this.filterForm.patchValue({
          search: params['search'] || '',
          category: params['category'] || '',
          sortBy: params['sort'] || 'title'
        });

        if (params['page']) {
          this.currentPage = parseInt(params['page']);
        }
      }
      this.loadBooks();
    });
  }

  loadUserData(): void {
    const user = this.userAuthService.getCurrentUser();
    if (user) {
      this.userId = user.id;
    }

    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    this.wishlistService.wishlistCount$.subscribe(count => {
      this.wishlistCount = count;
    });
  }

  loadCategories(): void {
    this.browseService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        // Fallback to empty array
        this.categories = [];
      }
    });
  }

  loadSortOptions(): void {
    this.browseService.getSortOptions().subscribe({
      next: (options) => {
        this.sortOptions = options;
      },
      error: (error) => {
        console.error('Error loading sort options:', error);
        // Fallback to default options
        this.sortOptions = [
          { value: 'title', label: 'Title (A-Z)' },
          { value: 'title_desc', label: 'Title (Z-A)' },
          { value: 'author', label: 'Author' },
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'price_low', label: 'Price: Low to High' },
          { value: 'price_high', label: 'Price: High to Low' }
        ];
      }
    });
  }

  loadBooks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: BrowseFilters = {
      search: this.filterForm.get('search')?.value || undefined,
      category: this.filterForm.get('category')?.value || undefined,
      sortBy: this.filterForm.get('sortBy')?.value || 'title',
      page: this.currentPage,
      limit: this.pageSize
    };

    this.browseService.getBooks(filters).subscribe({
      next: (books: Book[]) => {

        this.books = books ?? [];
        this.filteredBooks = books ?? [];

        this.stats = {
          totalBooks: this.books.length,
          availableBooks: this.books.filter(b => b.stock > 0).length,
          wishlistCount: this.books.filter(b => b.inWishlist).length
        };

        this.totalPages = Math.ceil(this.stats.totalBooks / this.pageSize);

        this.loadRatings(this.books);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.errorMessage = 'Error loading books';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1; // Reset to first page on new filter

    // Update URL with query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.filterForm.get('search')?.value || null,
        category: this.filterForm.get('category')?.value || null,
        sort: this.filterForm.get('sortBy')?.value || null,
        page: this.currentPage
      },
      queryParamsHandling: 'merge'
    });

    this.loadBooks();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      category: '',
      sortBy: 'title'
    });
    this.currentPage = 1;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });

    this.loadBooks();
  }

  filterByCategory(category: string): void {
    this.filterForm.patchValue({ category });
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page },
      queryParamsHandling: 'merge'
    });

    this.loadBooks();
  }

  addToCart(book: Book, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (book.stock === 0) {
      this.showNotification('Book is out of stock', 'error');
      return;
    }

    this.cartService.addToCart(book.id, 1).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification(`${book.title} added to cart!`, 'success');
          this.addedToCartSet.add(book.id);
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
   * FIXED: Pass book.id instead of entire book object
   */
  toggleWishlist(book: Book, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!book.id) {
      this.showNotification('Invalid book', 'error');
      return;
    }

    if (book.inWishlist) {
      this.wishlistService.removeFromWishlist(book.id).subscribe({
        next: (response) => {
          if (response.success) {
            book.inWishlist = false;
            this.showNotification(`${book.title} removed from wishlist`, 'info');
            this.updateWishlistCount(-1);
          }
        },
        error: (error) => {
          console.error('Error removing from wishlist:', error);
          this.showNotification(error.error?.message || 'Error updating wishlist', 'error');
        }
      });
    } else {
      // FIXED: Pass book.id instead of book
      this.wishlistService.addToWishlist(book.id).subscribe({
        next: (response) => {
          if (response.success) {
            book.inWishlist = true;
            this.showNotification(`${book.title} added to wishlist!`, 'success');
            this.updateWishlistCount(1);
          }
        },
        error: (error) => {
          console.error('Error adding to wishlist:', error);
          this.showNotification(error.error?.message || 'Error updating wishlist', 'error');
        }
      });
    }
  }

  viewBookDetails(book: Book): void {
    this.selectedBook = book;
    // Open modal
    const modalElement = document.getElementById('bookDetailsModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  viewBookPage(bookId: number): void {
    this.router.navigate(['/book', bookId]);
  }

  updateWishlistCount(change: number): void {
    this.stats.wishlistCount += change;
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
    if (!book.coverImage || book.coverImage.trim() === '') {
      return '';
    }

    // If full URL already
    //if (book.coverImage.startsWith('http')) {
    return book.coverImage;
    // }

    // Serve from root, not /api
    //return `http://localhost:9999/${book.coverImage}`;
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
            // Silently ignore errors
            this.bookRatings[id] = { avg: 0, count: 0 };
          }
        });
      }
    });
  }

  truncateDescription(description: string = '', maxLength: number = 120): string {
    if (!description) return 'No description available.';
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const iconClass = type === 'success' ? 'fa-check-circle' :
      type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle';

    notification.innerHTML = `<i class="fas ${iconClass} me-2"></i>${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}