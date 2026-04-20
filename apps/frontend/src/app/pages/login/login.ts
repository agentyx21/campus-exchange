import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to your CampusExchange account</p>

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit()" aria-label="Login form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" [(ngModel)]="email" name="email" placeholder="your.name@fau.edu" required aria-required="true" />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" [(ngModel)]="password" name="password" placeholder="Enter your password" required aria-required="true" />
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading" aria-label="Sign in">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="footer-text">
          Don't have an account? <a routerLink="/register">Sign up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
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
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 420px;
    }
    h2 { margin: 0 0 0.5rem; font-size: 1.8rem; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
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
    .form-group input:focus { border-color: #003366; }
    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #CC0000;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .btn-primary:disabled { opacity: 0.6; }
    .error {
      background: #fee;
      color: #c00;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .footer-text {
      text-align: center;
      margin-top: 1.5rem;
      color: #666;
    }
    .footer-text a { color: #CC0000; font-weight: 600; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  private returnUrl = '/';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.error = err.status === 403
          ? 'Your account is pending email verification. Please check your FAU email.'
          : (err.error?.message || 'Invalid credentials');
        this.loading = false;
      },
    });
  }
}
