export interface Category {
  name: string;
  count: number;
  icon: string;
  isActive?: boolean;
}

export interface CategoryStats {
  totalCategories: number;
  totalBooks: number;
  availableBooks: number;
}

export interface CategoryBook extends Book {
  // Inherits from Book interface
}

// Re-use or import your existing Book interface
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
  language?: string;
  createdAt?: Date;
}