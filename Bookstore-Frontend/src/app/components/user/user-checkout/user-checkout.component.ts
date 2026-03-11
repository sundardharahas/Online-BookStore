import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAuthService } from '../../../services/user-auth.service';
import { CartService } from '../../../services/cart.service';
import { CheckoutService } from '../../../services/checkout.service';
import { CartItem, ShippingAddress, OrderSummary } from '../../../models/checkout.model';

@Component({
  selector: 'app-user-checkout',
  templateUrl: './user-checkout.component.html',
  styleUrls: ['./user-checkout.component.css']
})
export class UserCheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  orderSummary: OrderSummary = {
    subtotal: 0,
    shipping: 5,
    tax: 0,
    total: 0,
    hasFreeShipping: false,
    items: []
  };
  
  isLoading = true;
  isPlacingOrder = false;
  errorMessage = '';
  successMessage = '';
  
  // Forms
  shippingForm: FormGroup;
  selectedPaymentMethod: 'cod' | 'upi' | 'card' = 'cod';
  
  // User data
  userEmail: string = '';
  cartCount: number = 0;
  
  // Progress
  currentStep: number = 3; // Review step
  totalSteps: number = 3;

  constructor(
    private checkoutService: CheckoutService,
    private userAuthService: UserAuthService,
    private cartService: CartService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadCartItems();
    
    // Auto-fill for demo (remove in production)
    setTimeout(() => {
      if (!this.shippingForm.get('fullName')?.value) {
        this.shippingForm.patchValue({
          fullName: 'John Doe',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          phone: '5551234567'
        });
      }
    }, 500);
  }

  loadUserData(): void {
    const user = this.userAuthService.getCurrentUser();
    if (user) {
      this.userEmail = user.email || '';
      this.shippingForm.patchValue({ email: this.userEmail });
    }
    
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
  }

  loadCartItems(): void {
    this.isLoading = true;
    
    // Using 1 as default userId matching backend design
    this.checkoutService.getCartItems(1).subscribe({
      next: (items) => {
        // Calculate itemTotal which the backend doesn't provide
        items.forEach(item => item.itemTotal = (item.price || 0) * (item.quantity || 1));
        this.cartItems = items;
        this.calculateOrderSummary();
        this.isLoading = false;
        
        if (items.length === 0) {
          this.router.navigate(['/cart']);
        }
      },
      error: (error) => {
        console.error('Error loading cart items:', error);
        this.errorMessage = 'Failed to load cart items. Please try again.';
        this.isLoading = false;
      }
    });
  }

  calculateOrderSummary(): void {
    const summary = this.checkoutService.calculateOrderSummary(this.cartItems);
    this.orderSummary = {
      ...summary,
      items: this.cartItems
    };
  }

  selectPaymentMethod(method: 'cod' | 'upi' | 'card'): void {
    this.selectedPaymentMethod = method;
  }

  validatePaymentFields(): boolean {
    if (this.selectedPaymentMethod === 'upi') {
      const upiId = (document.querySelector('input[name="upiId"]') as HTMLInputElement)?.value;
      if (!upiId || !upiId.includes('@')) {
        return false;
      }
    }
    
    if (this.selectedPaymentMethod === 'card') {
      const cardNumber = (document.querySelector('input[name="cardNumber"]') as HTMLInputElement)?.value;
      const expiry = (document.querySelector('input[name="expiry"]') as HTMLInputElement)?.value;
      const cvv = (document.querySelector('input[name="cvv"]') as HTMLInputElement)?.value;
      const cardName = (document.querySelector('input[name="cardName"]') as HTMLInputElement)?.value;
      
      // Remove spaces from card number
      const cleanCardNumber = cardNumber?.replace(/\s/g, '') || '';
      
      if (!cardName || cleanCardNumber.length !== 16 || !expiry?.match(/^\d{2}\/\d{2}$/) || !cvv?.match(/^\d{3,4}$/)) {
        return false;
      }
    }
    
    return true;
  }

  placeOrder(): void {
    // Validate shipping form
    if (this.shippingForm.invalid) {
      this.markFormGroupTouched(this.shippingForm);
      this.errorMessage = 'Please fill all shipping details correctly.';
      return;
    }
    
    // Validate payment fields
    if (!this.validatePaymentFields()) {
      this.errorMessage = 'Please fill all payment details correctly.';
      return;
    }
    
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Your cart is empty. Please add items to cart before checkout.';
      return;
    }
    
    this.isPlacingOrder = true;
    this.errorMessage = '';
    
    // Prepare order data
    const shippingAddress: ShippingAddress = {
      fullName: this.shippingForm.get('fullName')?.value,
      address: this.shippingForm.get('address')?.value,
      city: this.shippingForm.get('city')?.value,
      state: this.shippingForm.get('state')?.value,
      zipCode: this.shippingForm.get('zipCode')?.value,
      phone: this.shippingForm.get('phone')?.value,
      email: this.userEmail
    };
    
    // Get payment details
    let paymentDetails: any = { method: this.selectedPaymentMethod };
    
    if (this.selectedPaymentMethod === 'upi') {
      paymentDetails.upiId = (document.querySelector('input[name="upiId"]') as HTMLInputElement)?.value;
    } else if (this.selectedPaymentMethod === 'card') {
      paymentDetails.cardNumber = (document.querySelector('input[name="cardNumber"]') as HTMLInputElement)?.value.replace(/\s/g, '');
      paymentDetails.expiry = (document.querySelector('input[name="expiry"]') as HTMLInputElement)?.value;
      paymentDetails.cvv = (document.querySelector('input[name="cvv"]') as HTMLInputElement)?.value;
      paymentDetails.cardName = (document.querySelector('input[name="cardName"]') as HTMLInputElement)?.value;
    }
    
    // Get current user ID
    const currentUser = this.userAuthService.getCurrentUser();
    const userId = currentUser?.id || 1;
    
    const orderData = {
      userId,
      shippingAddress,
      paymentMethod: this.selectedPaymentMethod,
      paymentDetails,
      items: this.cartItems,
      subtotal: this.orderSummary.subtotal,
      shipping: this.orderSummary.shipping,
      tax: this.orderSummary.tax,
      total: this.orderSummary.total
    };
    
    this.checkoutService.placeOrder(orderData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Order placed successfully!';
          // Clear cart, 1 is the simulated userId
          this.cartService.clearCart(1).subscribe();
          
          // Redirect to order confirmation
          setTimeout(() => {
            this.router.navigate(['/order-confirmation', response.orderId]);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to place order. Please try again.';
          this.isPlacingOrder = false;
        }
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.errorMessage = error.error?.message || 'Error placing order. Please try again.';
        this.isPlacingOrder = false;
      }
    });
  }

  get userInitial(): string {
    return this.userEmail ? this.userEmail.charAt(0).toUpperCase() : 'U';
  }

  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }

  getAmountForFreeShipping(): number {
    return this.checkoutService.getAmountForFreeShipping(this.orderSummary.subtotal);
  }

  formatCurrency(amount: number): string {
    return this.checkoutService.formatCurrency(amount);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Format phone number
  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 6) {
      value = value.replace(/(\d{3})(\d+)/, '$1-$2');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
    }
    event.target.value = value.substring(0, 12);
    this.shippingForm.get('phone')?.setValue(value);
  }

  // Format card number
  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    event.target.value = value.substring(0, 19);
  }

  // Format expiry date
  formatExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value.substring(0, 5);
  }

  // Format ZIP code
  formatZipCode(event: any): void {
    event.target.value = event.target.value.replace(/\D/g, '').substring(0, 5);
    this.shippingForm.get('zipCode')?.setValue(event.target.value);
  }

  logout(): void {
    this.userAuthService.logout();
    this.router.navigate(['/login']);
  }
}