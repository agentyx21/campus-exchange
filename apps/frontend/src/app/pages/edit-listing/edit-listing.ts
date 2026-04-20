import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingsService } from '../../services/listings.service';
import { AuthService } from '../../services/auth.service';
import { Category, Listing, UpdateListingRequest } from '@campusexchange/shared';

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="create-page">
      <div class="form-card">
        @if (pageLoading) {
          <p class="loading-text">Loading listing...</p>
        } @else if (listing) {
          <h2>Edit Listing</h2>
          <p class="subtitle">Update your listing details</p>

          @if (error) {
            <div class="error">{{ error }}</div>
          }
          @if (success) {
            <div class="success">{{ success }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Title</label>
              <input type="text" [(ngModel)]="title" name="title" required />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="description" name="description" required></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Price ($)</label>
                <input type="number" [(ngModel)]="price" name="price" min="0" step="0.01" required />
              </div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="categoryId" name="categoryId" required>
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
                <select [(ngModel)]="listingType" name="listingType" disabled>
                  <option value="fixed">Fixed Price</option>
                  <option value="bidding">Accept Bids</option>
                </select>
                <small class="field-hint">Listing type cannot be changed</small>
              </div>
            </div>

            <div class="form-group">
              <label>Photos</label>
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
                <div class="error image-error">{{ imageError }}</div>
              }
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        } @else {
          <div class="error">Listing not found or you don't have permission to edit it.</div>
        }
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
    .form-group select:disabled { background: #f0f0f0; color: #999; }
    textarea { min-height: 100px; resize: vertical; font-family: inherit; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: #003366;
    }
    .form-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }
    .btn-primary {
      flex: 1;
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
    .btn-secondary {
      flex: 1;
      padding: 14px;
      background: white;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
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
    .loading-text { text-align: center; color: #999; padding: 2rem; }
    .field-hint { color: #999; font-size: 0.8rem; margin-top: 4px; display: block; }

    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 6px;
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
      transition: border-color 0.2s, color 0.2s;
    }
    .add-slot:hover {
      border-color: #003366;
      color: #003366;
    }
    .add-plus { font-size: 2rem; font-weight: 300; line-height: 1; }
    .add-label { font-size: 0.85rem; }
    .image-error { margin-top: 6px; }
  `]
})
export class EditListingComponent implements OnInit {
  // Keep these matched with the server-side validator + create-listing client cap.
  readonly maxImageMb = 3;
  readonly maxImages = 10;
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png'];

  listing?: Listing;
  categories: Category[] = [];
  title = '';
  description = '';
  price?: number;
  categoryId?: number;
  conditionStatus: 'new' | 'like_new' | 'good' | 'fair' | 'poor' = 'good';
  listingType: 'fixed' | 'bidding' = 'fixed';

  // Working copy of the image list shown in the UI. Always an array of data
  // URIs or public URLs; edits happen locally and are flushed on submit.
  images: string[] = [];
  private originalImages: string[] = [];
  imageError = '';

  pageLoading = true;
  saving = false;
  error = '';
  success = '';
  private listingId!: number;

  constructor(
    private route: ActivatedRoute,
    private listingsService: ListingsService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.listingId = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(this.listingId)) {
      this.pageLoading = false;
      return;
    }

    this.listingsService.getCategories().subscribe((cats) => (this.categories = cats));

    this.listingsService.getListing(this.listingId).subscribe({
      next: (listing) => {
        // Only the owner may edit. Server enforces this on PUT; checking here
        // prevents showing another user's listing contents in the form.
        if (listing.seller.id !== this.auth.currentUser?.id) {
          this.router.navigate(['/listing', this.listingId]);
          return;
        }
        this.listing = listing;
        this.title = listing.title;
        this.description = listing.description;
        this.price = Number(listing.price);
        this.categoryId = listing.category.id;
        this.conditionStatus = listing.conditionStatus as typeof this.conditionStatus;
        this.listingType = listing.listingType as typeof this.listingType;

        // Hydrate the local image list from the server and remember the
        // starting state so we can skip the image update entirely if the
        // user didn't touch photos (saves a delete+reinsert round-trip).
        this.images = (listing.images ?? []).map((img) => img.imageUrl);
        this.originalImages = [...this.images];

        this.pageLoading = false;
      },
      error: () => {
        this.pageLoading = false;
      },
    });
  }

  removeImage(index: number) {
    this.imageError = '';
    this.images.splice(index, 1);
  }

  onFileSelected(event: Event) {
    this.imageError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Always clear the input so picking the same file twice still fires change.
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

  private imagesChanged(): boolean {
    if (this.images.length !== this.originalImages.length) return true;
    return this.images.some((url, i) => url !== this.originalImages[i]);
  }

  onSubmit() {
    this.error = '';
    this.success = '';

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

    this.saving = true;

    const payload: UpdateListingRequest = {
      title: this.title.trim(),
      description: this.description.trim(),
      price: this.price,
      categoryId: this.categoryId,
      conditionStatus: this.conditionStatus,
    };
    if (this.imagesChanged()) {
      payload.imageUrls = this.images;
    }

    this.listingsService.updateListing(this.listingId, payload).subscribe({
      next: () => {
        this.success = 'Listing updated successfully!';
        this.saving = false;
        setTimeout(() => this.router.navigate(['/listing', this.listingId]), 1000);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = (Array.isArray(msg) ? msg[0] : msg) || 'Failed to update listing';
        this.saving = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/listing', this.listingId]);
  }
}
