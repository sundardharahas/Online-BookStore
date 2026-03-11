import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {}

 onSubmit(): void {

  if (this.loginForm.invalid) {
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  const { email, password } = this.loginForm.value;

  this.authService.login(email, password).subscribe({
    next: (response) => {

      console.log('FULL RESPONSE:', response);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      this.isLoading = false;

      const role = response.user.role;

      if (role === 'ADMIN') {
        console.log("Navigating to Admin Dashboard");
        // Also store admin credentials so AdminGuard allows access
        localStorage.setItem('admin_token', response.token);
        localStorage.setItem('admin', JSON.stringify(response.user));
        this.router.navigate(['/admin/dashboard']);
      } else {
        console.log("Navigating to User Dashboard");
        this.router.navigate(['/dashboard']);
      }
    },
    error: () => {
      this.isLoading = false;
      this.errorMessage = 'Invalid email or password';
    }
  });
}

  demoLogin(): void {
    this.loginForm.patchValue({
      email: 'demo@smartbookstore.com',
      password: 'demo123456'
    });
    this.onSubmit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Convenience getters for form controls
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}