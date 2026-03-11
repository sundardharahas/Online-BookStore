import { Book } from './book.model';

export interface WishlistItem {
  id: number;
  book: Book;
}

export interface WishlistStats {
  totalItems: number;
  currentlyReading: number;
  completedReads: number;
}

export interface WishlistResponse {
  success: boolean;
  message?: string;
}