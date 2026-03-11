import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Admin, AdminLoginResponse, AdminCredentials } from '../models/admin.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private currentAdminSubject = new BehaviorSubject<Admin | null>(null);
  public currentAdmin$ = this.currentAdminSubject.asObservable();

  // Hardcoded admin credentials (as per your requirement)
  private readonly ADMIN_EMAIL = 'admin@gmail.com';
  private readonly ADMIN_PASSWORD = 'admin123';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAdmin();
  }

  private loadStoredAdmin(): void {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      this.currentAdminSubject.next(JSON.parse(storedAdmin));
    }
  }

  login(credentials: AdminCredentials): Observable<AdminLoginResponse> {
    // Option 1: Hardcoded validation (as per your requirement)
    if (credentials.email === this.ADMIN_EMAIL && credentials.password === this.ADMIN_PASSWORD) {
      const admin: Admin = {
        id: 1,
        email: this.ADMIN_EMAIL,
        name: 'Administrator',
        role: 'admin',
        lastLogin: new Date()
      };

      const response: AdminLoginResponse = {
        success: true,
        token: 'admin-hardcoded-token-' + Date.now(),
        admin: admin
      };

      this.handleAuthResponse(response);
      return of(response);
    }

    // Option 2: API call to your backend (uncomment if you want to use API)
    /*
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        map(response => {
          if (response.success) {
            this.handleAuthResponse(response);
          }
          return response;
        }),
        catchError(error => {
          return of({
            success: false,
            token: '',
            admin: null as any,
            message: error.error?.message || 'Login failed'
          });
        })
      );
    */

    // Return error for invalid credentials
    return of({
      success: false,
      token: '',
      admin: null as any,
      message: 'Invalid admin credentials'
    });
  }

  private handleAuthResponse(response: AdminLoginResponse): void {
    if (response.success && response.admin) {
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      this.currentAdminSubject.next(response.admin);
    }
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentAdminSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('admin_token');
    const admin = localStorage.getItem('admin');
    // Also reload the subject if localStorage has data but subject is null
    if (token && admin && !this.currentAdminSubject.value) {
      this.currentAdminSubject.next(JSON.parse(admin));
    }
    return !!(token && admin);
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  getCurrentAdmin(): Admin | null {
    return this.currentAdminSubject.value;
  }
}