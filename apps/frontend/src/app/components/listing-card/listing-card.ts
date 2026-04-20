import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Listing } from '@campusexchange/shared';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, TitleCasePipe],
  template: `
    <a [routerLink]="['/listing', listing.id]" class="card">
      <div class="card-image">
        @if (listing.images && listing.images.length > 0 && !imageFailed) {
          <img [src]="listing.images[0].imageUrl" [alt]="listing.title" (error)="imageFailed = true" />
        } @else {
          <div class="placeholder-image">📦</div>
        }
        @if (listing.listingType === 'bidding') {
          <span class="badge-bid">Bidding</span>
        }
      </div>
      <div class="card-body">
        <h3 class="card-title">{{ listing.title }}</h3>
        <p class="card-price">{{ listing.price | currency }}</p>
        <div class="card-meta">
          <span class="card-condition">{{ listing.conditionStatus | titlecase }}</span>
          <span class="card-category">{{ listing.category.name }}</span>
        </div>
        @if (listing.listingType === 'bidding' && listing.bidEndDate) {
          <p class="card-auction-end">
            Auction ends {{ listing.bidEndDate | date:'short' }}
          </p>
        }
        <div class="card-footer">
          <span class="card-seller">{{ listing.seller.firstName }} {{ listing.seller.lastName }}</span>
          <span class="card-date">{{ listing.createdAt | date:'shortDate' }}</span>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .card {
      display: block;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }
    .card-image {
      height: 200px;
      background: #f0f0f0;
      position: relative;
      overflow: hidden;
    }
    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder-image {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      background: #f8f9fa;
    }
    .badge-bid {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #CC0000;
      color: #fff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .card-body { padding: 1rem; }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #CC0000;
      margin: 0 0 0.5rem;
    }
    .card-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 0.5rem;
    }
    .card-condition, .card-category {
      font-size: 0.75rem;
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 4px;
      color: #666;
    }
    .card-auction-end {
      margin: 0 0 0.5rem;
      font-size: 0.78rem;
      color: #CC0000;
      font-weight: 500;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #999;
    }
  `]
})
export class ListingCardComponent {
  @Input() listing!: Listing;
  imageFailed = false;
}
