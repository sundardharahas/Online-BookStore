import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { ReviewService, Review, ReviewStats } from '../../../services/review.service';
import { Book } from '../../../models/book.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css']
})
export class BookDetailsComponent implements OnInit {
  book: Book | null = null;
  isLoading = true;
  activeTab = 'description';

  // Review data
  reviews: Review[] = [];
  reviewStats: ReviewStats | null = null;
  userReview: Review = { userId: 0, bookId: 0, rating: 0, comment: '' };
  hoverRating = 0;
  isSubmitting = false;
  currentUserId: number = 0;
  hasReviewed = false;
  notification = { show: false, message: '', type: '' };
  isAddedToCart = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private reviewService: ReviewService
  ) { }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.currentUserId = user?.id || 0;

    this.route.params.subscribe(params => {
      const bookId = +params['id'];
      this.loadBook(bookId);
      this.loadReviews(bookId);
    });
  }

  loadBook(id: number): void {
    this.isLoading = true;
    this.http.get<Book>(`${environment.apiUrl}/books/${id}`).subscribe({
      next: (book) => {
        this.book = book;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadReviews(bookId: number): void {
    this.reviewService.getBookReviews(bookId).subscribe({
      next: (stats) => {
        this.reviewStats = stats;
        this.reviews = stats.reviews || [];
        // Check if current user has already reviewed
        const existing = this.reviews.find(r => r.userId === this.currentUserId);
        if (existing) {
          this.hasReviewed = true;
          this.userReview = { ...existing };
        } else {
          this.userReview = { userId: this.currentUserId, bookId, rating: 0, comment: '' };
        }
      },
      error: (err) => console.error('Error loading reviews:', err)
    });
  }

  setRating(star: number): void {
    this.userReview.rating = star;
  }

  submitReview(): void {
    if (!this.userReview.rating || this.userReview.rating < 1) {
      this.showNotification('Please select a rating', 'error');
      return;
    }
    if (!this.userReview.comment || this.userReview.comment.trim().length < 5) {
      this.showNotification('Please write at least 5 characters', 'error');
      return;
    }

    this.isSubmitting = true;
    this.userReview.bookId = this.book?.id || 0;
    this.userReview.userId = this.currentUserId;

    this.reviewService.submitReview(this.userReview).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.showNotification(res.message, 'success');
          this.loadReviews(this.book?.id || 0);
          this.hasReviewed = true;
        } else {
          this.showNotification(res.message, 'error');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.showNotification('Failed to submit review', 'error');
      }
    });
  }

  deleteReview(reviewId: number): void {
    this.reviewService.deleteReview(reviewId, this.currentUserId).subscribe({
      next: (res) => {
        if (res.success) {
          this.showNotification('Review deleted', 'success');
          this.hasReviewed = false;
          this.userReview = { userId: this.currentUserId, bookId: this.book?.id || 0, rating: 0, comment: '' };
          this.loadReviews(this.book?.id || 0);
        }
      }
    });
  }

  addToCart(): void {
    if (this.book) {
      if (this.isAddedToCart) return;
      this.cartService.addToCart(this.book.id, 1).subscribe({
        next: (res) => {
          if (res.success) {
            this.showNotification('Added to cart!', 'success');
            this.isAddedToCart = true;
          }
        },
        error: () => this.showNotification('Failed to add to cart', 'error')
      });
    }
  }

  addToWishlist(): void {
    if (this.book) {
      this.wishlistService.addToWishlist(this.book.id).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.showNotification('Added to wishlist!', 'success');
            if (this.book) this.book.inWishlist = true;
          }
        },
        error: () => this.showNotification('Failed to add to wishlist', 'error')
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/browse']);
  }

  getStockStatus(): { class: string; text: string } {
    if (!this.book) return { class: '', text: '' };
    if (this.book.stock === 0) return { class: 'out-of-stock', text: 'Out of Stock' };
    if (this.book.stock < 5) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'in-stock', text: 'In Stock' };
  }

  getStarArray(rating: number): number[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.round(rating) ? 1 : 0);
  }

  getRatingPercent(star: number): number {
    if (!this.reviewStats || this.reviewStats.totalReviews === 0) return 0;
    const count = this.reviewStats.ratingCounts[star] || 0;
    return (count / this.reviewStats.totalReviews) * 100;
  }

  getTimeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  private showNotification(message: string, type: string): void {
    this.notification = { show: true, message, type };
    setTimeout(() => this.notification.show = false, 3000);
  }
}
