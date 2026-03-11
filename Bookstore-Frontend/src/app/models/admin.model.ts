export interface Admin {
  id: number;
  email: string;
  name: string;
  role: string;
  lastLogin?: Date;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  admin: Admin;
  message?: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalCategories: number;
  totalOrders: number;
  pendingOrders: number;
}

export interface AdminCredentials {
  email: string;
  password: string;
}