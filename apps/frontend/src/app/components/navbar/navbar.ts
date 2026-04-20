import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" aria-label="Main navigation">
      <div class="nav-container">
        <a routerLink="/" class="logo" aria-label="CampusExchange Home">
          <img src="/logo.png" alt="FAU" class="logo-img" aria-hidden="true" />
          <span class="logo-text">CampusExchange</span>
        </a>

        <div class="nav-links" role="navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" aria-label="Browse listings">Browse</a>
          @if (auth.isLoggedIn) {
            <a routerLink="/create-listing" routerLinkActive="active" aria-label="Create a new listing">Sell Item</a>
            <a routerLink="/messages" routerLinkActive="active" aria-label="View messages">Messages</a>
            <a routerLink="/profile" routerLinkActive="active" aria-label="View profile">Profile</a>
            @if (auth.isAdmin) {
              <a routerLink="/admin" routerLinkActive="active" aria-label="Admin dashboard">Admin</a>
            }
            <button class="btn-logout" (click)="logout()" aria-label="Log out of your account">Logout</button>
          } @else {
            <a routerLink="/login" routerLinkActive="active" aria-label="Sign in to your account">Login</a>
            <a routerLink="/register" routerLinkActive="active" class="btn-register" aria-label="Create a new account">Sign Up</a>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #003366;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
    }
    .logo-img { height: 36px; width: auto; }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .nav-links a {
      color: #d4d4d8;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #fff;
    }
    .btn-register {
      background: #CC0000;
      color: #fff !important;
      padding: 8px 20px;
      border-radius: 6px;
    }
    .btn-logout {
      background: transparent;
      color: #d4d4d8;
      border: 1px solid #d4d4d8;
      padding: 6px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-logout:hover {
      color: #fff;
      border-color: #fff;
    }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
