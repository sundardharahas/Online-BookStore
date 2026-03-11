import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  passwordStrengthClass = '';
  passwordStrengthText = 'Password strength';

  constructor(
    private fb: FormBuilder,
    private authService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, Validators.requiredTrue],
      role: ['USER']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get f() { return this.registerForm.controls; }

  onPasswordInput(): void {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (!password) {
      this.passwordStrengthText = 'Password strength';
      this.passwordStrengthClass = '';
    } else if (strength <= 2) {
      this.passwordStrengthText = 'Weak password';
      this.passwordStrengthClass = 'strength-weak';
    } else if (strength <= 4) {
      this.passwordStrengthText = 'Medium password';
      this.passwordStrengthClass = 'strength-medium';
    } else {
      this.passwordStrengthText = 'Strong password';
      this.passwordStrengthClass = 'strength-strong';
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { confirmPassword, terms, ...userData } = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Registration Error', err);
        this.errorMessage = 'Registration failed. The email might already be in use.';
      }
    });
  }
}
