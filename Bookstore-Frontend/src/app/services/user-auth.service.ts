import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginResponse, UserStats } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private userStatsSubject = new BehaviorSubject<UserStats>({
    totalOrders: 0,
    wishlistCount: 0,
    cartCount: 0
  });
  public userStats$ = this.userStatsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      this.currentUserSubject.next(JSON.parse(storedUser));
      this.loadUserStats();
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(response => {
          if (response.success) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            this.loadUserStats();
          }
          return response;
        }),
        catchError(error => {
          return of({
            success: false,
            token: '',
            user: null as any,
            message: error.error?.message || 'Login failed'
          });
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.userStatsSubject.next({
      totalOrders: 0,
      wishlistCount: 0,
      cartCount: 0
    });
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  loadUserStats(): void {
    // This would be an API call in real implementation
    // For now, we'll use mock data
    setTimeout(() => {
      this.userStatsSubject.next({
        totalOrders: 5,
        wishlistCount: 3,
        cartCount: 2
      });
    }, 500);
  }

  updateUserStats(stats: Partial<UserStats>): void {
    const currentStats = this.userStatsSubject.value;
    this.userStatsSubject.next({
      ...currentStats,
      ...stats
    });
  }

  getUserInitial(): string {
    const user = this.getCurrentUser();
    if (user?.fullname) {
      return user.fullname.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getUserName(): string {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.name || user?.username || 'Reader';
}
}