import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListingsService } from '../../services/listings.service';
import { Category, CreateListingRequest } from '@campusexchange/shared';

@Component({
  selector: 'app-create-listing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="create-page">
      <div class="form-card">
        <h2>Create a Listing</h2>
        <p class="subtitle">Sell or rent your items to fellow FAU students</p>

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Title</label>
            <input type="text" [(ngModel)]="title" name="title" placeholder="e.g. Calculus Textbook 10th Edition" required />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="description" name="description" placeholder="Describe your item..." required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Price ($)</label>
              <input type="number" [(ngModel)]="price" name="price" min="0" step="0.01" required />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="categoryId" name="categoryId" required>
                <option [ngValue]="undefined" disabled>Select category</option>
                @for (cat of categories; track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Condition</label>
              <select [(ngModel)]="conditionStatus" name="conditionStatus">
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label>Listing Type</label>
              <select [(ngModel)]="listingType" name="listingType">
                <option value="fixed">Fixed Price</option>
                <option value="bidding">Accept Bids</option>
              </select>
            </div>
          </div>

          @if (listingType === 'bidding') {
            <div class="form-group">
              <label>Bidding End Date</label>
              <input
                type="datetime-local"
                [(ngModel)]="bidEndDate"
                name="bidEndDate"
                required
              />
              <small class="field-hint">Required for bidding listings.</small>
            </div>
          }

          <div class="form-group">
            <label>Photos (optional)</label>
            <div class="image-grid">
              @for (img of images; track $index; let i = $index) {
                <div class="image-item">
                  <img [src]="img" alt="Listing photo" />
                  @if (i === 0) {
                    <span class="primary-badge">Primary</span>
                  }
                  <button
                    type="button"
                    class="remove-btn"
                    (click)="removeImage(i)"
                    aria-label="Remove photo"
                  >✕</button>
                </div>
              }
              @if (images.length < maxImages) {
                <label class="add-slot">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    (change)="onFileSelected($event)"
                    hidden
                  />
                  <span class="add-plus">+</span>
                  <span class="add-label">Add photo</span>
                </label>
              }
            </div>
            <small class="field-hint">
              JPEG or PNG, up to {{ maxImageMb }} MB each. Max {{ maxImages }} photos.
              The first photo is used as the primary.
            </small>
            @if (imageError) {
              <div class="error">{{ imageError }}</div>
            }
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Post Listing' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-page {
      min-height: calc(100vh - 64px);
      background: #f8f9fa;
      padding: 2rem;
      display: flex;
      justify-content: center;
    }
    .form-card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 600px;
    }
    h2 { margin: 0 0 0.5rem; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group { margin-bottom: 1rem; flex: 1; }
    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
    }
    textarea { min-height: 100px; resize: vertical; font-family: inherit; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: #003366;
    }
    .field-hint {
      display: block;
      margin-top: 6px;
      color: #666;
      font-size: 0.8rem;
    }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
    }
    .image-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #eee;
      background: #f0f0f0;
    }
    .image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .primary-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      background: #003366;
      color: #fff;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .remove-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .remove-btn:hover { background: #CC0000; }
    .add-slot {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      cursor: pointer;
      color: #888;
    }
    .add-slot:hover {
      border-color: #003366;
      color: #003366;
    }
    .add-plus { font-size: 2rem; font-weight: 300; line-height: 1; }
    .add-label { font-size: 0.85rem; }
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
    }
    .btn-primary:disabled { opacity: 0.6; }
    .error {
      background: #fee;
      color: #c00;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
  `]
})
export class CreateListingComponent implements OnInit {
  // Keep these aligned with the server-side validator and edit-listing limits.
  readonly maxImageMb = 3;
  readonly maxImages = 10;
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png'];

  categories: Category[] = [];
  title = '';
  description = '';
  price?: number;
  categoryId?: number;
  conditionStatus: 'new' | 'like_new' | 'good' | 'fair' | 'poor' = 'good';
  listingType: 'fixed' | 'bidding' = 'fixed';
  bidEndDate = '';
  // Array of data URIs — every picked file is appended here. The first entry
  // is treated as primary on the backend.
  images: string[] = [];
  imageError = '';
  loading = false;
  error = '';

  constructor(
    private listingsService: ListingsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.listingsService.getCategories().subscribe((cats) => (this.categories = cats));
  }

  removeImage(index: number) {
    this.imageError = '';
    this.images.splice(index, 1);
  }

  onFileSelected(event: Event) {
    this.imageError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Always clear so re-picking the same file fires change again.
    input.value = '';
    if (!file) return;

    if (this.images.length >= this.maxImages) {
      this.imageError = `You can have at most ${this.maxImages} photos.`;
      return;
    }
    if (!this.allowedMimeTypes.includes(file.type)) {
      this.imageError = 'Please choose a JPEG or PNG image.';
      return;
    }
    if (file.size > this.maxImageMb * 1024 * 1024) {
      this.imageError = `Image must be ${this.maxImageMb} MB or smaller.`;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.images.push(reader.result);
      }
    };
    reader.onerror = () => {
      this.imageError = 'Could not read the selected file.';
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    this.error = '';

    if (!this.title.trim() || !this.description.trim()) {
      this.error = 'Title and description are required.';
      return;
    }
    if (!this.price || this.price <= 0) {
      this.error = 'Please enter a valid price.';
      return;
    }
    if (!this.categoryId) {
      this.error = 'Please select a category.';
      return;
    }
    if (this.listingType === 'bidding' && !this.bidEndDate) {
      this.error = 'Please pick an end date for the auction.';
      return;
    }
    if (this.listingType === 'bidding' && this.bidEndDate && new Date(this.bidEndDate) <= new Date()) {
      this.error = 'Bidding end date must be in the future.';
      return;
    }

    this.loading = true;

    const data: CreateListingRequest = {
      title: this.title.trim(),
      description: this.description.trim(),
      price: this.price,
      categoryId: this.categoryId,
      conditionStatus: this.conditionStatus,
      listingType: this.listingType,
      bidEndDate: this.listingType === 'bidding' && this.bidEndDate ? this.bidEndDate : undefined,
      imageUrls: this.images.length > 0 ? this.images : undefined,
    };

    this.listingsService.createListing(data).subscribe({
      next: (listing) => {
        this.router.navigate(['/listing', listing.id]);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = (Array.isArray(msg) ? msg[0] : msg) || 'Failed to create listing';
        this.loading = false;
      },
    });
  }
}
