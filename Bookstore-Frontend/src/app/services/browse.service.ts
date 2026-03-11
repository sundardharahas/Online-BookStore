import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Book, BrowseFilters, BrowseStats } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrowseService {
  private apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  /**
   * Get books with optional filters from backend API
   */
  getBooks(filters: BrowseFilters): Observable<Book[]> {
  return this.http.get<Book[]>(`${environment.apiUrl}/books`);
}

  /**
   * Get all available categories from backend
   */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Get sort options (these can be hardcoded or fetched from backend)
   */
  getSortOptions(): Observable<{ value: string; label: string }[]> {
    // You can either hardcode these or fetch from backend
    return new Observable(observer => {
      observer.next([
        { value: 'title', label: 'Title (A-Z)' },
        { value: 'title_desc', label: 'Title (Z-A)' },
        { value: 'author', label: 'Author' },
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' }
      ]);
      observer.complete();
    });
  }

  /**
   * Get a single book by ID
   */
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get featured/recommended books
   */
  getFeaturedBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/featured`);
  }

  /**
   * Get new arrivals
   */
  getNewArrivals(limit: number = 10): Observable<Book[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Book[]>(`${this.apiUrl}/new-arrivals`, { params });
  }

  /**
   * Search books by title, author, or ISBN
   */
  searchBooks(query: string): Observable<Book[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Book[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Get books by category
   */
  getBooksByCategory(category: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/category/${category}`);
  }
}