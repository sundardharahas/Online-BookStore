import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../services/user-auth.service';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-navbar',
  templateUrl: './user-navbar.component.html',
  styleUrls: ['./user-navbar.component.css']
})
export class UserNavbarComponent implements OnInit, OnDestroy {
  cartCount = 0;
  wishlistCount = 0;
  userInitial = 'U';
  userName = 'Reader';
  private subscriptions: Subscription[] = [];

  constructor(
    private userAuthService: UserAuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.userAuthService.getCurrentUser();
    const userId = user && user.id ? user.id : 1;
    this.cartService.loadCart(userId);
    this.wishlistService.loadWishlist();

    this.subscriptions.push(
      this.cartService.cartCount$.subscribe(count => {
        this.cartCount = count;
      }),
      
      this.wishlistService.wishlistCount$.subscribe(count => {
        this.wishlistCount = count;
      }),
      
      this.userAuthService.currentUser$.subscribe(user => {
        if (user) {
          this.userInitial = this.userAuthService.getUserInitial();
          this.userName = this.userAuthService.getUserName();
        }
      })
    );
  }

  logout(): void {
    this.userAuthService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}