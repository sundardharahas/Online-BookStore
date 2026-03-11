import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  totalOrders: number;
}

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: UserData[] = [];
  filteredUsers: UserData[] = [];
  searchQuery = '';
  selectedRole = 'all';
  isLoading = true;

  // Stats
  totalUsers = 0;
  totalAdmins = 0;
  totalCustomers = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.http.get<UserData[]>(`${environment.apiUrl}/users/admin/all`).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.totalUsers = users.length;
        this.totalAdmins = users.filter(u => u.role === 'ADMIN').length;
        this.totalCustomers = users.filter(u => u.role === 'USER').length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  filterByRole(role: string): void {
    this.selectedRole = role;
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = this.users;

    if (this.selectedRole !== 'all') {
      result = result.filter(u => u.role === this.selectedRole);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    this.filteredUsers = result;
  }

  getRoleBadgeClass(role: string): string {
    return role === 'ADMIN' ? 'badge-admin' : 'badge-user';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    this.router.navigate(['/login']);
  }
}
