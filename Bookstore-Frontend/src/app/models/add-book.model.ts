export interface AddBookRequest {
  title: string;
  author: string;
  isbn: string;
  year?: number;
  description: string;
  category: string;
  price: number;
  stock: number;
  publisher?: string;
  language: string;
  coverImage?: File;
}

export interface AddBookResponse {
  success: boolean;
  message: string;
  bookId?: number;
  errors?: { [key: string]: string };
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
}

export interface Language {
  code: string;
  name: string;
}