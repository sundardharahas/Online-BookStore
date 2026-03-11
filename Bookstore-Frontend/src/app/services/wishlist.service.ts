import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WishlistItem, WishlistStats, WishlistResponse } from '../models/user-wishlist.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private apiUrl = `${environment.apiUrl}/wishlist`;

  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  private wishlistCountSubject = new BehaviorSubject<number>(0);
  public wishlistCount$ = this.wishlistCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load wishlist items
   */
  loadWishlist(): void {
    this.getWishlist().subscribe({
      next: (items) => {
        this.wishlistSubject.next(items);
        this.wishlistCountSubject.next(items.length);
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        this.wishlistSubject.next([]);
        this.wishlistCountSubject.next(0);
      }
    });
  }

  /**
   * Get wishlist
   */
  getWishlist(): Observable<WishlistItem[]> {

    const user = JSON.parse(localStorage.getItem('user')!);

    return this.http
      .get<WishlistItem[]>(`${this.apiUrl}/${user.id}`)
      .pipe(
        tap(items => {
          this.wishlistSubject.next(items);
          this.wishlistCountSubject.next(items.length);
        })
      );
  }

  /**
   * Wishlist statistics
   */
  getWishlistStats(): Observable<WishlistStats> {

    const user = JSON.parse(localStorage.getItem('user')!);

    return this.http.get<WishlistStats>(`${this.apiUrl}/stats/${user.id}`);
  }

  /**
   * Add to wishlist
   */
  addToWishlist(bookId: number): Observable<WishlistResponse> {

    const user = JSON.parse(localStorage.getItem('user')!);

    return this.http.post<WishlistResponse>(
      `${this.apiUrl}?userId=${user.id}&bookId=${bookId}`,
      {}
    );
  }

  /**
   * Remove from wishlist
   */
  removeFromWishlist(bookId: number): Observable<WishlistResponse> {

    const user = JSON.parse(localStorage.getItem('user')!);

    return this.http.delete<WishlistResponse>(
      `${this.apiUrl}?userId=${user.id}&bookId=${bookId}`
    );
  }

  /**
   * Refresh wishlist
   */
  refreshWishlist(): void {
    this.loadWishlist();
  }
}