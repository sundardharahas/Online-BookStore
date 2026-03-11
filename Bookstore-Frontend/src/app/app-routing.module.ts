import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// User Components
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDashboardComponent } from './components/user/user-dashboard/user-dashboard.component';
import { UserCartComponent } from './components/user/user-cart/user-cart.component';
import { UserOrdersComponent } from './components/user/user-orders/user-orders.component';
import { UserWishlistComponent } from './components/user/user-wishlist/user-wishlist.component';
import { BookDetailsComponent } from './components/user/book-details/book-details.component';
import { UserProfileComponent } from './components/user/user-profile/user-profile.component';
import { UserBrowseComponent } from './components/user/user-browse/user-browse.component';
//import { UserCategoriesComponent } from './components/user/user-categories/user-categories.component';
import { UserCheckoutComponent } from './components/user/user-checkout/user-checkout.component';
import { OrderConfirmationComponent } from './components/user/order-confirmation/order-confirmation.component';
import { UserOrderDetailsComponent } from './components/user/user-order-details/user-order-details.component';


// Admin Components
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AddBookComponent } from './components/admin/add-book/add-book.component';
import { ManageBooksComponent } from './components/admin/manage-books/manage-books.component';
import { AdminOrdersComponent } from './components/admin/admin-orders/admin-orders.component';
import { AdminProfileComponent } from './components/admin/admin-profile/admin-profile.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';

// Guards
import { UserGuard } from './guards/user.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Authentication Routes (Public)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // User Routes (Protected)
  { path: 'dashboard', component: UserDashboardComponent, canActivate: [UserGuard] },
  { path: 'cart', component: UserCartComponent, canActivate: [UserGuard] },
  { path: 'orders', component: UserOrdersComponent, canActivate: [UserGuard] },
  { path: 'wishlist', component: UserWishlistComponent, canActivate: [UserGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [UserGuard] },
  { path: 'book/:id', component: BookDetailsComponent, canActivate: [UserGuard] },
  { path: 'browse', component: UserBrowseComponent, canActivate: [UserGuard] },
  { path: 'checkout', component: UserCheckoutComponent, canActivate: [UserGuard] },
  { path: 'order-confirmation/:id', component: OrderConfirmationComponent, canActivate: [UserGuard] },
  { path: 'order/:id', component: UserOrderDetailsComponent, canActivate: [UserGuard] },
   //{ path: 'categories', component: UserCategoriesComponent, canActivate: [UserGuard] },

  // Admin Routes (Protected)
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/add-book', component: AddBookComponent, canActivate: [AdminGuard] },
  { path: 'admin/books', component: ManageBooksComponent, canActivate: [AdminGuard] },
  { path: 'admin/books/edit/:id', component: AddBookComponent, canActivate: [AdminGuard] },
  { path: 'admin/orders', component: AdminOrdersComponent, canActivate: [AdminGuard] },
  { path: 'admin/profile', component: AdminProfileComponent, canActivate: [AdminGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [AdminGuard] },

  // Wildcard route
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }