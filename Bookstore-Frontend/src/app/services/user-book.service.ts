import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserBook } from '../models/user-book.model';

@Injectable({
  providedIn: 'root'
})
export class UserBookService {
  // Mock data for testing
  private mockBooks: UserBook[] = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Fiction',
      price: 12.99,
      stock: 10,
      coverImage: '',
      description: 'A classic novel about the American Dream in the Jazz Age.'
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      category: 'Fiction',
      price: 14.99,
      stock: 5,
      coverImage: '',
      description: 'A powerful story of racial injustice and loss of innocence.'
    },
    {
      id: 3,
      title: '1984',
      author: 'George Orwell',
      category: 'Science Fiction',
      price: 11.99,
      stock: 0,
      coverImage: '',
      description: 'A dystopian social science fiction novel and cautionary tale.'
    },
    {
      id: 4,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      category: 'Romance',
      price: 9.99,
      stock: 8,
      coverImage: '',
      description: 'A romantic novel of manners set in early 19th-century England.'
    },
    {
      id: 5,
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      category: 'Fantasy',
      price: 15.99,
      stock: 7,
      coverImage: '',
      description: 'A fantasy novel about the adventures of Bilbo Baggins.'
    },
    {
      id: 6,
      title: 'Dune',
      author: 'Frank Herbert',
      category: 'Science Fiction',
      price: 18.99,
      stock: 4,
      coverImage: '',
      description: 'An epic science fiction novel set in a distant future.'
    }
  ];

  private mockRecommendations: UserBook[] = [
    {
      id: 7,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      category: 'Fiction',
      price: 13.99,
      stock: 12,
      coverImage: '',
      description: 'A story about teenage alienation and loss of innocence.'
    },
    {
      id: 8,
      title: 'Brave New World',
      author: 'Aldous Huxley',
      category: 'Science Fiction',
      price: 14.99,
      stock: 6,
      coverImage: '',
      description: 'A dystopian social science fiction novel.'
    }
  ];

  constructor() {}

  getBooks(): Observable<UserBook[]> {
    return of(this.mockBooks);
  }

  getRecommendations(): Observable<UserBook[]> {
    return of(this.mockRecommendations);
  }

  getBookById(id: number): Observable<UserBook | undefined> {
    const book = this.mockBooks.find(b => b.id === id);
    return of(book);
  }

  searchBooks(query: string): Observable<UserBook[]> {
    const searchTerm = query.toLowerCase();
    const filtered = this.mockBooks.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      book.category.toLowerCase().includes(searchTerm)
    );
    return of(filtered);
  }

  getCategories(): Observable<string[]> {
    const categories = [...new Set(this.mockBooks.map(book => book.category))];
    return of(categories);
  }
}