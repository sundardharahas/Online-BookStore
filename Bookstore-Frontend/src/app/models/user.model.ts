export interface User {
  id: number;
  email: string;
  fullname: string;
  role: string;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface UserStats {
  totalOrders: number;
  wishlistCount: number;
  cartCount: number;
}
