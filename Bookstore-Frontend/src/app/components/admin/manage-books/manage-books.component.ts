import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-manage-books',
  templateUrl: './manage-books.component.html',
  styleUrls: ['./manage-books.component.css']
})
export class ManageBooksComponent implements OnInit {

  books: Book[] = [];
  filteredBooks: Book[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  selectedCategory = 'all';
  categories: string[] = [];

  constructor(
    private router: Router,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  // =========================
  // LOAD BOOKS FROM BACKEND
  // =========================
  loadBooks(): void {
    this.isLoading = true;

    this.bookService.getAllBooks().subscribe({
      next: (data) => {
        this.books = data;
        this.filteredBooks = data;
        this.extractCategories();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load books';
        this.isLoading = false;
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
    this.categories = Array.from(categorySet).sort();
  }

  // =========================
  // SEARCH
  // =========================
  onSearch(query: string): void {
    this.searchQuery = query;

    if (query.trim() === '') {
      this.filterByCategory(this.selectedCategory);
      return;
    }

    this.filteredBooks = this.books.filter(book =>
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      (book.isbn && book.isbn.includes(query)) ||
      book.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  // =========================
  // FILTER
  // =========================
  filterByCategory(category: string): void {
    this.selectedCategory = category;

    if (category === 'all') {
      this.filteredBooks = this.books;
    } else {
      this.filteredBooks = this.books.filter(book =>
        book.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (this.searchQuery.trim() !== '') {
      this.onSearch(this.searchQuery);
    }
  }

  // =========================
  // DELETE BOOK (REAL API)
  // =========================
  deleteBook(id: number, title: string): void {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {

      this.bookService.deleteBook(id).subscribe({
        next: () => {
          this.successMessage = 'Book deleted successfully';
          this.loadBooks();
        },
        error: () => {
          this.errorMessage = 'Failed to delete book';
        }
      });
    }
  }

  editBook(id: number): void {
    this.router.navigate(['/admin/books/edit', id]);
  }

  addNewBook(): void {
    this.router.navigate(['/admin/add-book']);
  }

  viewDashboard(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  // =========================
  // STOCK BADGES
  // =========================
  getStockBadgeClass(stock: number): string {
    if (stock > 10) return 'bg-success';
    if (stock > 0) return 'bg-warning';
    return 'bg-danger';
  }

  getStockText(stock: number): string {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  }

  getCoverImage(book: Book): string {
    return book.coverImage && book.coverImage.trim() !== ''
      ? book.coverImage
      : '';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.filteredBooks = this.books;
  }

  refreshData(): void {
    this.loadBooks();
  }

  // =========================
  // STATS
  // =========================
  getTotalBooks(): number {
    return this.books.length;
  }

  getInStockCount(): number {
    return this.books.filter(book => book.stock > 10).length;
  }

  getLowStockCount(): number {
    return this.books.filter(book => book.stock > 0 && book.stock <= 10).length;
  }

  getOutOfStockCount(): number {
    return this.books.filter(book => book.stock === 0).length;
  }
}