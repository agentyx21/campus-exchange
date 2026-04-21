import { Component } from '@angular/core';

@Component({
  selector: 'app-banned',
  standalone: true,
  template: `
    <div class="banned-page">
      <div class="banned-card">
        <div class="icon">🚫</div>
        <h1>Account Suspended</h1>
        <p class="message">
          You've been banned from this platform.
        </p>
        <p class="contact">
          If you believe this was an error, please contact your administrator.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .banned-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 2rem;
    }
    .banned-card {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      max-width: 480px;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 {
      font-size: 1.8rem;
      color: #CC0000;
      margin: 0 0 1rem;
    }
    .message {
      font-size: 1.1rem;
      color: #333;
      margin-bottom: 1rem;
      line-height: 1.6;
    }
    .contact {
      color: #666;
      font-size: 0.95rem;
      line-height: 1.5;
    }
  `]
})
export class BannedComponent {}
