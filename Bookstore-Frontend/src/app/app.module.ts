import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';  // ✅ ADDED
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// User Components
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDashboardComponent } from './components/user/user-dashboard/user-dashboard.component';
import { UserNavbarComponent } from './components/user/user-navbar/user-navbar.component';
import { UserCartComponent } from './components/user/user-cart/user-cart.component';
import { UserOrdersComponent } from './components/user/user-orders/user-orders.component';
import { UserWishlistComponent } from './components/user/user-wishlist/user-wishlist.component';
import { BookDetailsComponent } from './components/user/book-details/book-details.component';
import { UserProfileComponent } from './components/user/user-profile/user-profile.component';
import { UserBrowseComponent } from './components/user/user-browse/user-browse.component';
//import { UserCategoriesComponent } from './components/user/user-categories/user-categories.component';
//import { UserCheckoutComponent } from './components/user/user-checkout/user-checkout.component';

// Admin Components
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminSidebarComponent } from './components/admin/admin-sidebar/admin-sidebar.component';
import { AddBookComponent } from './components/admin/add-book/add-book.component';
import { ManageBooksComponent } from './components/admin/manage-books/manage-books.component';
import { AdminOrdersComponent } from './components/admin/admin-orders/admin-orders.component';
import { AdminProfileComponent } from './components/admin/admin-profile/admin-profile.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';

// Shared Components
import { ChatbotComponent } from './components/shared/chatbot/chatbot.component';
import { NotificationComponent } from './components/shared/notification/notification.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UserCheckoutComponent } from './components/user/user-checkout/user-checkout.component';
import { OrderConfirmationComponent } from './components/user/order-confirmation/order-confirmation.component';
import { UserOrderDetailsComponent } from './components/user/user-order-details/user-order-details.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    UserDashboardComponent,
    UserNavbarComponent,
    UserBrowseComponent,
    UserCartComponent,
     UserCheckoutComponent,
    UserOrdersComponent,
    UserWishlistComponent,
    BookDetailsComponent,
    UserProfileComponent,
    AdminDashboardComponent,
    AdminSidebarComponent,
    AddBookComponent,
    ManageBooksComponent,
    AdminOrdersComponent,
    AdminProfileComponent,
    AdminUsersComponent,
    ChatbotComponent,
    NotificationComponent,
    OrderConfirmationComponent,
    UserOrderDetailsComponent,
    //UserCategoriesComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,   // ✅ FIXED
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }