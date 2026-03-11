import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { User, UserStats } from '../../../models/user.model';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  currentUser: User | null = null;
  userStats: UserStats = {
    totalOrders: 0,
    wishlistCount: 0,
    cartCount: 0
  };
  isLoading: boolean = true;
  userInitial: string = 'U';

  constructor(
    private userAuthService: UserAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Redirect if not logged in
    if (!this.userAuthService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    
    // Subscribe to current user
    this.userAuthService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.userInitial = this.userAuthService.getUserInitial();
    });

    // Subscribe to user stats
    this.userAuthService.userStats$.subscribe(stats => {
      this.userStats = stats;
      this.isLoading = false;
    });

    // We call loadUserStats to ensure the BehaviorSubject triggers with fresh data
    this.userAuthService.loadUserStats();
  }

  logout(): void {
    this.userAuthService.logout();
  }
}
