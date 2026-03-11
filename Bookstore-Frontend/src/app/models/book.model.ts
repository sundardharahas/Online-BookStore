export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  price: number;
  stock: number;
  coverImage?: string;
  description?: string;
  publisher?: string;
  publicationYear?: number;
  language?: string;
  rating?: number;
  available?: boolean;
  inWishlist?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BrowseFilters {
  search?: string;
  category?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface BrowseStats {
  totalBooks: number;
  availableBooks: number;
  wishlistCount: number;
}

export interface BooksResponse {
  success: boolean;
  books: Book[];
  total: number;
  page: number;
  limit: number;
  stats?: BrowseStats;
  message?: string;
}

export interface CartItem {
  cartId: number;
  bookId: number;
  book: Book;
  quantity: number;
  itemTotal?: number;
}