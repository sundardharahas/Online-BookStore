import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Book } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  private apiUrl = `${environment.apiUrl}/books`;

  private booksSubject = new BehaviorSubject<Book[]>([]);
  books$ = this.booksSubject.asObservable();

  constructor(private http: HttpClient) {}

  // =========================
  // CREATE
  // =========================
  addBook(book: any): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book);
  }

  // =========================
  // READ (ALL BOOKS)
  // =========================
  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  // (Keep this if used elsewhere)
  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  // =========================
  // READ BY ID
  // =========================
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  // =========================
  // DELETE
  // =========================
  deleteBook(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =========================
  // SEARCH
  // =========================
  searchBooks(query: string): Observable<Book[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Book[]>(`${this.apiUrl}/search`, { params });
  }

  getBooksByCategory(category: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/category/${category}`);
  }

  getRecommendations(): Observable<Book[]> {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id;
    const url = userId
      ? `${environment.apiUrl}/chatbot/recommendations?userId=${userId}`
      : `${environment.apiUrl}/chatbot/recommendations`;
    return this.http.get<{success: boolean, recommendations: Book[]}>(url).pipe(
      map((response: any) => response.recommendations || [])
    );
  }

  updateBooksList(books: Book[]): void {
    this.booksSubject.next(books);
  }
}