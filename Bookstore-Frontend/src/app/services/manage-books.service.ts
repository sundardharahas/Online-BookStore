import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Book, BooksResponse, DeleteResponse } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManageBooksService {
  private apiUrl = `${environment.apiUrl}/admin/books`;

  // Mock data for testing
  private mockBooks: Book[] = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      category: 'Classic',
      price: 12.99,
      stock: 50,
      coverImage: 'https://www.bhagavad-gita.us/wp-content/uploads/2012/09/gita-136.jpg',
      description: 'A classic novel about the American Dream in the Jazz Age.',
      publisher: 'Charles Scribner\'s Sons',
      publishedYear: 1925,
      language: 'English'
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061120084',
      category: 'Fiction',
      price: 14.99,
      stock: 35,
      coverImage: '',
      description: 'A powerful story of racial injustice and loss of innocence.',
      publisher: 'J.B. Lippincott & Co.',
      publishedYear: 1960,
      language: 'English'
    },
    {
      id: 3,
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      category: 'Science Fiction',
      price: 11.99,
      stock: 5,
      coverImage: '',
      description: 'A dystopian social science fiction novel and cautionary tale.',
      publisher: 'Secker & Warburg',
      publishedYear: 1949,
      language: 'English'
    },
    {
      id: 4,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '9780141439518',
      category: 'Romance',
      price: 9.99,
      stock: 0,
      coverImage: '',
      description: 'A romantic novel of manners set in early 19th-century England.',
      publisher: 'T. Egerton',
      publishedYear: 1813,
      language: 'English'
    },
    {
      id: 5,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '9780316769488',
      category: 'Fiction',
      price: 13.99,
      stock: 12,
      coverImage: '',
      description: 'A story about teenage alienation and loss of innocence.',
      publisher: 'Little, Brown and Company',
      publishedYear: 1951,
      language: 'English'
    }
  ];

  constructor(private http: HttpClient) {}

  getAllBooks(): Observable<BooksResponse> {
    // For testing with mock data
    return of({
      success: true,
      books: this.mockBooks,
      total: this.mockBooks.length
    });

    // Actual API call (uncomment when backend is ready)
    // return this.http.get<BooksResponse>(this.apiUrl);
  }

  deleteBook(id: number): Observable<DeleteResponse> {
    // For testing with mock data
    return of({
      success: true,
      message: 'Book deleted successfully'
    });

    // Actual API call (uncomment when backend is ready)
    // return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }

  getBookById(id: number): Observable<Book> {
    const book = this.mockBooks.find(b => b.id === id);
    return of(book as Book);
  }

  searchBooks(query: string): Observable<Book[]> {
    const filtered = this.mockBooks.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.isbn.includes(query) ||
      book.category.toLowerCase().includes(query.toLowerCase())
    );
    return of(filtered);
  }

  filterByCategory(category: string): Observable<Book[]> {
    if (category === 'all') {
      return of(this.mockBooks);
    }
    const filtered = this.mockBooks.filter(book => 
      book.category.toLowerCase() === category.toLowerCase()
    );
    return of(filtered);
  }
}