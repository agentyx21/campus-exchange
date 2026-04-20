import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        @if (!otpStep) {
          <h2>Join CampusExchange</h2>
          <p class="subtitle">Create your account with your FAU email</p>

          @if (error) {
            <div class="error">{{ error }}</div>
          }
          @if (success) {
            <div class="success">{{ success }}</div>
          }

          <form (ngSubmit)="onSubmit()" aria-label="Registration form">
            <div class="form-row">
              <div class="form-group">
                <label for="reg-firstname">First Name</label>
                <input
                  type="text"
                  id="reg-firstname"
                  [(ngModel)]="firstName"
                  name="firstName"
                  required
                  aria-required="true"
                />
              </div>
              <div class="form-group">
                <label for="reg-lastname">Last Name</label>
                <input
                  type="text"
                  id="reg-lastname"
                  [(ngModel)]="lastName"
                  name="lastName"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="reg-email">FAU Email</label>
              <input
                type="email"
                id="reg-email"
                [(ngModel)]="email"
                name="email"
                placeholder="your.name@fau.edu"
                required
                pattern=".+@fau\\.edu$"
                aria-required="true"
              />
              @if (email && !email.endsWith('@fau.edu')) {
                <small class="field-hint">Must be an @fau.edu email</small>
              }
            </div>
            <div class="form-group">
              <label for="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                [(ngModel)]="password"
                name="password"
                placeholder="Min. 8 chars, uppercase + number"
                required
                minlength="8"
                aria-required="true"
              />
            </div>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="loading"
              aria-label="Create account"
            >
              {{ loading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>

          <p class="footer-text">
            Already have an account? <a routerLink="/login">Sign in</a>
          </p>
        } @else {
          <h2>Check your FAU email</h2>
          <p class="subtitle">
            We sent a 6-digit code to <strong>{{ registeredEmail }}</strong>
          </p>

          @if (error) {
            <div class="error">{{ error }}</div>
          }

          <div class="form-group">
            <label for="otp-input">Verification Code</label>
            <input
              type="number"
              id="otp-input"
              [(ngModel)]="enteredOtp"
              name="otp"
              placeholder="123456"
              maxlength="6"
              aria-label="6-digit verification code"
            />
          </div>
          <button
            class="btn-primary"
            [disabled]="loading"
            (click)="onVerify()"
            aria-label="Verify code"
          >
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: calc(100vh - 64px);
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        padding: 2rem;
      }
      .auth-card {
        background: white;
        padding: 2.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        width: 100%;
        max-width: 420px;
      }
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.8rem;
      }
      .subtitle {
        color: #666;
        margin-bottom: 1.5rem;
      }
      .form-row {
        display: flex;
        gap: 1rem;
      }
      .form-group {
        margin-bottom: 1rem;
        flex: 1;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.3rem;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .form-group input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        outline: none;
        box-sizing: border-box;
      }
      .form-group input:focus {
        border-color: #003366;
      }
      .btn-primary {
        width: 100%;
        padding: 14px;
        background: #cc0000;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      .btn-primary:disabled {
        opacity: 0.6;
      }
      .error {
        background: #fee;
        color: #c00;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 1rem;
      }
      .success {
        background: #efe;
        color: #060;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 1rem;
      }
      .footer-text {
        text-align: center;
        margin-top: 1.5rem;
        color: #666;
      }
      .footer-text a {
        color: #cc0000;
        font-weight: 600;
      }
      .field-hint {
        color: #c00;
        font-size: 0.8rem;
        margin-top: 4px;
        display: block;
      }
    `,
  ],
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  loading = false;
  error = '';
  success = '';
  otpStep = false;
  registeredEmail = '';
  enteredOtp = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.error = 'All fields are required';
      return;
    }
    if (!this.email.endsWith('@fau.edu')) {
      this.error = 'Only @fau.edu email addresses are allowed';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.password)) {
      this.error = 'Password must contain uppercase, lowercase, and a number';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth
      .register({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
      })
      .subscribe({
        next: () => {
          this.registeredEmail = this.email;
          this.otpStep = true;
          this.loading = false;
        },
        error: (err) => {
          const msg = err.error?.message;
          this.error =
            (Array.isArray(msg) ? msg[0] : msg) || 'Registration failed';
          this.loading = false;
        },
      });
  }

  onVerify() {
    if (!this.enteredOtp) {
      this.error = 'Please enter the verification code';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.verifyOtp(this.registeredEmail, this.enteredOtp).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error =
          err.status === 400
            ? 'Invalid OTP. Please try again.'
            : err.error?.message || 'Verification failed';
        this.loading = false;
      },
    });
  }
}
