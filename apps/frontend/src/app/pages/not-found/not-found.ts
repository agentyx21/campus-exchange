import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-page">
      <div class="not-found-card">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/" class="btn-home">Back to Home</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 2rem;
    }
    .not-found-card {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      max-width: 450px;
    }
    h1 {
      font-size: 5rem;
      margin: 0;
      color: #CC0000;
      line-height: 1;
    }
    h2 {
      margin: 0.5rem 0 1rem;
      font-size: 1.5rem;
      color: #003366;
    }
    p {
      color: #666;
      margin-bottom: 2rem;
    }
    .btn-home {
      display: inline-block;
      padding: 12px 32px;
      background: #CC0000;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class NotFoundComponent {}
