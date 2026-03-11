import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddBookRequest, AddBookResponse, Category, Language } from '../models/add-book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddBookService {
  private apiUrl = `${environment.apiUrl}/admin/books`;

  constructor(private http: HttpClient) {}

  addBook(bookData: FormData): Observable<AddBookResponse> {
    return this.http.post<AddBookResponse>(this.apiUrl, bookData);
  }

  getCategories(): Observable<Category[]> {
    // Mock data - replace with actual API call
    return new Observable(observer => {
      observer.next([
        { id: 'fiction', name: 'Fiction', displayName: 'Fiction' },
        { id: 'non-fiction', name: 'Non-Fiction', displayName: 'Non-Fiction' },
        { id: 'science-fiction', name: 'Science Fiction', displayName: 'Science Fiction' },
        { id: 'mystery', name: 'Mystery', displayName: 'Mystery & Thriller' },
        { id: 'romance', name: 'Romance', displayName: 'Romance' },
        { id: 'biography', name: 'Biography', displayName: 'Biography' },
        { id: 'history', name: 'History', displayName: 'History' },
        { id: 'science', name: 'Science', displayName: 'Science' },
        { id: 'technology', name: 'Technology', displayName: 'Technology' },
        { id: 'business', name: 'Business', displayName: 'Business' },
        { id: 'self-help', name: 'Self-Help', displayName: 'Self-Help' },
        { id: 'fantasy', name: 'Fantasy', displayName: 'Fantasy' },
        { id: 'horror', name: 'Horror', displayName: 'Horror' },
        { id: 'poetry', name: 'Poetry', displayName: 'Poetry' },
        { id: 'drama', name: 'Drama', displayName: 'Drama' },
        { id: 'classic', name: 'Classic', displayName: 'Classic Literature' },
        { id: 'children', name: 'Children', displayName: "Children's Books" },
        { id: 'young-adult', name: 'Young Adult', displayName: 'Young Adult' },
        { id: 'other', name: 'Other', displayName: 'Other' }
      ]);
      observer.complete();
    });
  }

  getLanguages(): Observable<Language[]> {
    return new Observable(observer => {
      observer.next([
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'zh', name: 'Chinese' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ar', name: 'Arabic' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'other', name: 'Other' }
      ]);
      observer.complete();
    });
  }
}