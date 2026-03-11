export interface AdminBook {
  id?: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  coverImage?: string | File;
  publishedYear: number;
  publisher: string;
  pages: number;
  language: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: number;
  name: string;
  bookCount: number;
}