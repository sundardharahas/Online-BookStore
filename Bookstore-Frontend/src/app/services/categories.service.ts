import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, CategoryStats, Book } from '../models/categories.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private apiUrl = environment.apiUrl;

  // Helper method to get icon based on category name
  private getCategoryIcon(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'fiction': 'fas fa-book-open',
      'science': 'fas fa-flask',
      'technology': 'fas fa-laptop-code',
      'biography': 'fas fa-user',
      'history': 'fas fa-landmark',
      'fantasy': 'fas fa-dragon',
      'mystery': 'fas fa-user-secret',
      'romance': 'fas fa-heart',
      'thriller': 'fas fa-running',
      'self-help': 'fas fa-hands-helping',
      'business': 'fas fa-chart-line',
      'art': 'fas fa-palette',
      'cooking': 'fas fa-utensils',
      'travel': 'fas fa-plane',
      'philosophy': 'fas fa-brain',
      'poetry': 'fas fa-pen-fancy',
      'drama': 'fas fa-theater-masks',
      'children': 'fas fa-child',
      'young adult': 'fas fa-user-graduate'
    };
    
    const key = category?.toLowerCase() || '';
    return categoryMap[key] || 'fas fa-book';
  }

  constructor(private http: HttpClient) {}

  /**
   * Get all categories with book counts - FIXED ENDPOINT
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<string[]>(`${this.apiUrl}/books/categories`).pipe(
      map(categories => 
        categories.map(cat => ({
          name: cat,
          count: 0, // You might want to fetch counts separately or modify backend to return counts
          icon: this.getCategoryIcon(cat),
          isActive: false
        }))
      )
    );
  }

  /**
   * Get books by category
   */
  getBooksByCategory(category: string): Observable<Book[]> {
    const params = new HttpParams().set('category', category);
    return this.http.get<Book[]>(`${this.apiUrl}/books`, { params });
  }

  /**
   * Get category statistics
   */
  getCategoryStats(category?: string): Observable<CategoryStats> {
    const params = category ? new HttpParams().set('category', category) : undefined;
    return this.http.get<CategoryStats>(`${this.apiUrl}/categories/stats`, { params });
  }

  /**
   * Get all books
   */
  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`);
  }
}