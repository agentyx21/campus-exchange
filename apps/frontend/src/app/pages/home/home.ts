import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListingCardComponent } from '../../components/listing-card/listing-card';
import { ListingsService } from '../../services/listings.service';
import { Listing, Category } from '@campusexchange/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, ListingCardComponent],
  template: `
    <div class="home">
      <div class="hero">
        <h1>Buy & Sell Within the FAU Community</h1>
        <p>A trusted marketplace exclusively for FAU students</p>
        <div class="search-bar">
          <input
            type="text"
            placeholder="Search for textbooks, electronics, furniture..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="search()"
          />
          <button (click)="search()">Search</button>
        </div>
      </div>

      <div class="content">
        <div class="categories">
          <button
            class="cat-btn"
            [class.active]="!selectedCategory"
            (click)="filterByCategory(undefined)"
          >All</button>
          @for (cat of categories; track cat.id) {
            <button
              class="cat-btn"
              [class.active]="selectedCategory === cat.id"
              (click)="filterByCategory(cat.id)"
            >{{ cat.name }}</button>
          }
        </div>

        <div class="listings-grid">
          @if (loading) {
            <div class="empty-state"><p>Loading listings...</p></div>
          } @else {
            @for (listing of listings; track listing.id) {
              <app-listing-card [listing]="listing" />
            } @empty {
              <div class="empty-state">
                <p>{{ errorMsg || 'No listings found. Be the first to post!' }}</p>
              </div>
            }
          }
        </div>

        @if (totalPages > 1) {
          <div class="pagination">
            <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage <= 1">Previous</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= totalPages">Next</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #003366 0%, #002855 100%);
      color: white;
      text-align: center;
      padding: 3rem 2rem;
    }
    .hero h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
    .hero p { color: #aaa; margin-bottom: 1.5rem; font-size: 1.1rem; }
    .search-bar {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      gap: 0;
    }
    .search-bar input {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 8px 0 0 8px;
      font-size: 1rem;
      outline: none;
    }
    .search-bar button {
      padding: 14px 28px;
      background: #CC0000;
      color: white;
      border: none;
      border-radius: 0 8px 8px 0;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .categories {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .cat-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .cat-btn.active, .cat-btn:hover {
      background: #003366;
      color: white;
      border-color: #003366;
    }
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #999;
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    .pagination button {
      padding: 8px 20px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }
    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class HomeComponent implements OnInit {
  listings: Listing[] = [];
  categories: Category[] = [];
  searchQuery = '';
  selectedCategory?: number;
  currentPage = 1;
  totalPages = 1;
  loading = true;
  errorMsg = '';

  constructor(private listingsService: ListingsService) {}

  ngOnInit() {
    this.listingsService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('Failed to load categories:', err),
    });
    this.loadListings();
  }

  loadListings() {
    this.loading = true;
    this.errorMsg = '';
    this.listingsService
      .getListings({
        category: this.selectedCategory,
        search: this.searchQuery || undefined,
        page: this.currentPage,
      })
      .subscribe({
        next: (res) => {
          this.listings = res.data;
          this.totalPages = res.totalPages;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Failed to load listings. Please try again.';
          this.loading = false;
        },
      });
  }

  search() {
    this.searchQuery = this.searchQuery.trim();
    this.currentPage = 1;
    this.loadListings();
  }

  filterByCategory(categoryId?: number) {
    this.selectedCategory = categoryId;
    this.currentPage = 1;
    this.loadListings();
  }

  loadPage(page: number) {
    this.currentPage = page;
    this.loadListings();
  }
}
