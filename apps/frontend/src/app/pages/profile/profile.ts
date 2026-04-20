import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ListingsService } from '../../services/listings.service';
import { UserProfile, Listing } from '@campusexchange/shared';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="profile-page">
      <div class="profile-container">
        @if (loading) {
          <p class="loading-text">Loading profile...</p>
        } @else if (errorMsg) {
          <div class="error">{{ errorMsg }}</div>
        } @else if (user) {
          <div class="profile-header">
            <div class="avatar">{{ (user.firstName || '?')[0] }}{{ (user.lastName || '?')[0] }}</div>
            <div class="profile-info">
              <h2>{{ user.firstName }} {{ user.lastName }}</h2>
              <p class="email">{{ user.email }}</p>
              <div class="stats">
                <span>Rating: {{ user.averageRating }}/5 ({{ user.totalRatings }} reviews)</span>
                <span>Member since {{ user.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <div class="my-listings">
            <h3>My Listings</h3>
            @if (listingsLoading) {
              <p class="empty">Loading listings...</p>
            } @else {
              @for (listing of myListings; track listing.id) {
                <div class="listing-row">
                  <a [routerLink]="['/listing', listing.id]" class="listing-title">{{ listing.title }}</a>
                  <span class="listing-price">{{ listing.price | currency }}</span>
                  <span class="listing-status" [class]="listing.status">{{ listing.status }}</span>
                  <span class="listing-date">{{ listing.createdAt | date:'shortDate' }}</span>
                  @if (listing.status === 'active') {
                    <a [routerLink]="['/edit-listing', listing.id]" class="btn-edit">Edit</a>
                    <button class="btn-delete" (click)="deleteListing(listing)">Delete</button>
                  }
                </div>
              } @empty {
                <p class="empty">No listings yet. <a routerLink="/create-listing">Create one!</a></p>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: calc(100vh - 64px);
      background: #f8f9fa;
      padding: 2rem;
    }
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      margin-bottom: 2rem;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #003366;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
    }
    h2 { margin: 0 0 0.3rem; }
    .email { color: #666; margin: 0 0 0.5rem; }
    .stats { display: flex; gap: 1.5rem; color: #888; font-size: 0.9rem; }
    .my-listings {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .my-listings h3 { margin: 0 0 1rem; }
    .listing-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #eee;
    }
    .listing-title {
      flex: 1;
      color: #333;
      text-decoration: none;
      font-weight: 500;
    }
    .listing-title:hover { color: #CC0000; }
    .listing-price { font-weight: 600; color: #CC0000; }
    .listing-status {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    .listing-status.active { background: #efe; color: #060; }
    .listing-status.sold { background: #eef; color: #006; }
    .listing-status.hidden { background: #ffe; color: #660; }
    .listing-date { color: #999; font-size: 0.85rem; }
    .empty { color: #999; }
    .empty a { color: #CC0000; }
    .loading-text { text-align: center; color: #999; padding: 3rem; }
    .error { background: #fee; color: #c00; padding: 12px; border-radius: 8px; text-align: center; }
    .btn-edit {
      padding: 4px 12px;
      border: 1px solid #003366;
      border-radius: 4px;
      color: #003366;
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .btn-edit:hover { background: #003366; color: white; }
    .btn-delete {
      padding: 4px 12px;
      border: 1px solid #CC0000;
      border-radius: 4px;
      background: transparent;
      color: #CC0000;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete:hover { background: #CC0000; color: white; }
  `]
})
export class ProfileComponent implements OnInit {
  user?: UserProfile;
  myListings: Listing[] = [];
  loading = true;
  listingsLoading = true;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private listingsService: ListingsService,
  ) {}

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load profile.';
        this.loading = false;
      },
    });
    this.listingsService.getMyListings().subscribe({
      next: (listings) => {
        this.myListings = listings;
        this.listingsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load listings:', err);
        this.myListings = [];
        this.listingsLoading = false;
      },
    });
  }

  deleteListing(listing: Listing) {
    if (!confirm(`Are you sure you want to delete "${listing.title}"?`)) return;
    this.listingsService.deleteListing(listing.id).subscribe({
      next: () => {
        this.myListings = this.myListings.filter((l) => l.id !== listing.id);
      },
      error: () => {
        this.errorMsg = 'Failed to delete listing.';
      },
    });
  }
}
