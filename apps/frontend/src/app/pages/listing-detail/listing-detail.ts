import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ListingsService } from '../../services/listings.service';
import { BidsService } from '../../services/bids.service';
import { MessagesService } from '../../services/messages.service';
import { ReviewsService } from '../../services/reviews.service';
import { ReportsService, ReportReason } from '../../services/reports.service';
import { AuthService } from '../../services/auth.service';
import { EligibleBuyer, Listing, ReviewEligibility } from '@campusexchange/shared';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, TitleCasePipe, RouterLink],
  template: `
    @if (loading) {
      <div class="detail-page">
        <div class="loading-container">Loading listing...</div>
      </div>
    } @else if (listing) {
      <div class="detail-page">
        <div class="detail-container">
          <div class="images-section">
            @if (listing.images && listing.images.length > 0 && !imageFailed) {
              <img
                [src]="listing.images[currentImageIndex].imageUrl"
                [alt]="listing.title"
                class="main-image"
                (error)="imageFailed = true"
              />
              @if (listing.images.length > 1) {
                <div class="thumb-strip">
                  @for (img of listing.images; track img.id; let i = $index) {
                    <button
                      type="button"
                      class="thumb"
                      [class.active]="i === currentImageIndex"
                      (click)="currentImageIndex = i"
                      [attr.aria-label]="'Show photo ' + (i + 1)"
                    >
                      <img [src]="img.imageUrl" [alt]="'Photo ' + (i + 1)" />
                    </button>
                  }
                </div>
              }
            } @else {
              <div class="placeholder-image">📦</div>
            }
          </div>

          <div class="info-section">
            <div class="listing-header">
              <h1>{{ listing.title }}</h1>
              <p class="price">{{ listing.price | currency }}</p>
            </div>

            <div class="meta-tags">
              <span class="tag">{{ listing.conditionStatus | titlecase }}</span>
              <span class="tag">{{ listing.category.name }}</span>
              <span class="tag" [class.sold-tag]="listing.status === 'sold'">{{ listing.status | titlecase }}</span>
              @if (listing.listingType === 'bidding') {
                <span class="tag bid-tag">Accepting Bids</span>
              }
            </div>

            <div class="description">
              <h3>Description</h3>
              <p>{{ listing.description }}</p>
            </div>

            <div class="seller-info">
              <h3>Seller</h3>
              <div class="seller-card">
                <div class="seller-avatar">{{ (listing.seller.firstName || '?')[0] }}{{ (listing.seller.lastName || '?')[0] }}</div>
                <div>
                  <p class="seller-name">{{ listing.seller.firstName }} {{ listing.seller.lastName }}</p>
                  <p class="seller-rating">Rating: {{ listing.seller.averageRating }}/5</p>
                </div>
              </div>
            </div>

            @if (isOwner()) {
              <div class="owner-actions">
                <a [routerLink]="['/edit-listing', listing.id]" class="btn-edit">Edit Listing</a>
                <button class="btn-delete" (click)="deleteListing()" [disabled]="deleting">
                  {{ deleting ? 'Deleting...' : 'Delete Listing' }}
                </button>
              </div>

              @if (listing.status === 'active') {
                <div class="sold-section">
                  <h3>Mark as Sold</h3>
                  @if (eligibleBuyers.length > 0) {
                    <p class="section-note">Choose a buyer you messaged about this listing.</p>
                    <div class="sold-form">
                      <select [(ngModel)]="selectedBuyerId" name="selectedBuyerId">
                        <option [ngValue]="undefined">Select buyer</option>
                        @for (buyer of eligibleBuyers; track buyer.buyerId) {
                          <option [ngValue]="buyer.buyerId">
                            {{ buyer.firstName }} {{ buyer.lastName }} • {{ buyer.messageCount }} messages
                          </option>
                        }
                      </select>
                      <button class="btn-sold" (click)="markSold()" [disabled]="markingSold || !selectedBuyerId">
                        {{ markingSold ? 'Saving...' : 'Mark as Sold' }}
                      </button>
                    </div>
                  } @else {
                    <p class="section-note">A buyer will appear here after they message you about this listing.</p>
                  }
                </div>
              }
            }

            @if (listing.status === 'sold' && listing.soldToBuyer) {
              <div class="sold-summary">
                <h3>Sale Complete</h3>
                <p>Sold to {{ listing.soldToBuyer.firstName }} {{ listing.soldToBuyer.lastName }}.</p>
                @if (auth.isLoggedIn && auth.currentUser?.id === listing.soldToBuyer.id) {
                  <p class="sold-summary-note">Seller: {{ listing.seller.firstName }} {{ listing.seller.lastName }}.</p>
                }
              </div>
            }

            @if (listing.status === 'active' && listing.listingType === 'bidding' && !isBiddingExpired()) {
              <div class="bidding-section">
                <h3>Place a Bid</h3>
                @if (listing.bidEndDate) {
                  <p class="bid-end">
                    Auction ends: <strong>{{ listing.bidEndDate | date:'medium' }}</strong>
                  </p>
                }
                @if (listing.bids && listing.bids.length > 0) {
                  <p class="current-bid">Current highest bid: {{ listing.bids[0].amount | currency }}</p>
                }
                @if (auth.isLoggedIn && listing.seller.id !== auth.currentUser?.id) {
                  <p class="bid-hint">Minimum bid: {{ getMinBidAmount() | currency }}</p>
                  <div class="bid-form">
                    <input type="number" [(ngModel)]="bidAmount" [placeholder]="'Min: ' + getMinBidAmount().toFixed(2)" [min]="getMinBidAmount()" step="0.01" />
                    <button (click)="placeBid()" [disabled]="bidding">{{ bidding ? 'Placing...' : 'Place Bid' }}</button>
                  </div>
                }
              </div>
            } @else if (listing.status === 'active' && listing.listingType === 'bidding' && isBiddingExpired()) {
              <div class="bidding-section">
                <h3>Auction Ended</h3>
                @if (listing.bidEndDate) {
                  <p class="bid-end">Ended on {{ listing.bidEndDate | date:'medium' }}</p>
                }
                @if (listing.bids && listing.bids.length > 0) {
                  <p class="current-bid">Winning bid: {{ listing.bids[0].amount | currency }}</p>
                }
              </div>
            }

            @if (listing.status === 'active' && auth.isLoggedIn && listing.seller.id !== auth.currentUser?.id) {
              <div class="message-section">
                <h3>Contact Seller</h3>
                <textarea [(ngModel)]="messageContent" placeholder="Hi, is this still available?"></textarea>
                <button (click)="sendMessage()" class="btn-message" [disabled]="sending">{{ sending ? 'Sending...' : 'Send Message' }}</button>
              </div>
            }

            @if (listing.status === 'sold' && auth.isLoggedIn && reviewEligibility) {
              <div class="review-section">
                <h3>Transaction Review</h3>
                @if (reviewEligibility.canReview && reviewEligibility.reviewedUser) {
                  <p class="section-note">
                    You can now rate {{ reviewEligibility.reviewedUser.firstName }} {{ reviewEligibility.reviewedUser.lastName }}.
                  </p>
                  <div class="review-form">
                    <label>Rating</label>
                    <div class="star-rating" role="radiogroup" aria-label="Select a rating from 1 to 5 stars">
                      @for (star of stars; track star) {
                        <button
                          type="button"
                          class="star-button"
                          [class.active]="star <= reviewRating"
                          [attr.aria-label]="'Rate ' + star + ' star' + (star > 1 ? 's' : '')"
                          [attr.aria-checked]="star === reviewRating"
                          (click)="setReviewRating(star)"
                        >
                          ★
                        </button>
                      }
                    </div>
                    <p class="rating-label">{{ getReviewRatingLabel() }}</p>
                    <label for="reviewComment">Comment (optional)</label>
                    <textarea id="reviewComment" [(ngModel)]="reviewComment" name="reviewComment" placeholder="How did the transaction go?"></textarea>
                    <button class="btn-review" (click)="submitReview()" [disabled]="submittingReview">
                      {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
                    </button>
                  </div>
                } @else {
                  <p class="section-note">{{ reviewEligibility.reason }}</p>
                  @if (reviewEligibility.messageCount !== undefined) {
                    <p class="section-note">
                      Messages exchanged: {{ reviewEligibility.messageCount }}/{{ reviewEligibility.minimumMessages }}
                    </p>
                  }
                }
              </div>
            }

            @if (errorMsg) {
              <div class="error">{{ errorMsg }}</div>
            }
            @if (successMsg) {
              <div class="success">{{ successMsg }}</div>
            }

            @if (auth.isLoggedIn && !isOwner() && listing.status === 'active' && !auth.isAdmin) {
              <div class="report-section">
                @if (!showReportForm) {
                  <button
                    type="button"
                    class="btn-report-link"
                    (click)="showReportForm = true"
                  >
                    🚩 Report this listing
                  </button>
                } @else if (reportSubmitted) {
                  <p class="report-thanks">Thanks — the listing is queued for review.</p>
                } @else {
                  <h4>Report this listing</h4>
                  <label>Reason</label>
                  <select [(ngModel)]="reportReason" name="reportReason">
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="spam">Spam</option>
                    <option value="scam">Scam</option>
                    <option value="prohibited_item">Prohibited item</option>
                    <option value="other">Other</option>
                  </select>

                  <label>Details (optional)</label>
                  <textarea
                    [(ngModel)]="reportDescription"
                    name="reportDescription"
                    maxlength="2000"
                    placeholder="Add any context for the moderator..."
                  ></textarea>

                  <div class="report-actions">
                    <button
                      type="button"
                      class="btn-secondary"
                      (click)="showReportForm = false; reportDescription = ''"
                    >Cancel</button>
                    <button
                      type="button"
                      class="btn-report-submit"
                      (click)="submitReport()"
                      [disabled]="submittingReport"
                    >{{ submittingReport ? 'Sending...' : 'Submit report' }}</button>
                  </div>
                }
              </div>
            }

            <div class="listing-meta">
              <p>Posted {{ listing.createdAt | date:'mediumDate' }}</p>
              <p>{{ listing.viewsCount }} views</p>
            </div>
          </div>
        </div>
      </div>
    } @else if (errorMsg) {
      <div class="detail-page">
        <div class="error-container">{{ errorMsg }}</div>
      </div>
    }
  `,
  styles: [`
    .detail-page { background: #f8f9fa; min-height: calc(100vh - 64px); padding: 2rem; }
    .detail-container {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .loading-container, .error-container {
      max-width: 600px;
      margin: 2rem auto;
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
    }
    .error-container { color: #c00; }
    .images-section {
      background: #f0f0f0;
      min-height: 400px;
      display: flex;
      flex-direction: column;
    }
    .main-image {
      width: 100%;
      flex: 1;
      min-height: 0;
      object-fit: cover;
    }
    .thumb-strip {
      display: flex;
      gap: 8px;
      padding: 10px;
      background: #fff;
      overflow-x: auto;
      border-top: 1px solid #eee;
    }
    .thumb {
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      padding: 0;
      border-radius: 6px;
      border: 2px solid transparent;
      overflow: hidden;
      cursor: pointer;
      background: #f0f0f0;
      opacity: 0.7;
      transition: opacity 0.15s, border-color 0.15s;
    }
    .thumb:hover { opacity: 1; }
    .thumb.active {
      border-color: #003366;
      opacity: 1;
    }
    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .placeholder-image {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 5rem;
    }
    .info-section { padding: 2rem; }
    h1 { margin: 0 0 0.5rem; font-size: 1.8rem; }
    .price { font-size: 1.8rem; font-weight: 700; color: #CC0000; margin: 0 0 1rem; }
    .meta-tags { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .tag {
      padding: 4px 12px;
      background: #f0f0f0;
      border-radius: 20px;
      font-size: 0.85rem;
    }
    .bid-tag { background: #CC0000; color: white; }
    .sold-tag { background: #003366; color: white; }
    .description { margin-bottom: 1.5rem; }
    .description h3 { margin: 0 0 0.5rem; }
    .description p { color: #555; line-height: 1.6; }
    .seller-info { margin-bottom: 1.5rem; }
    .seller-card { display: flex; align-items: center; gap: 12px; }
    .seller-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #003366;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .seller-name { font-weight: 600; margin: 0; }
    .seller-rating { color: #888; margin: 0; font-size: 0.9rem; }
    .bidding-section, .message-section { margin-bottom: 1.5rem; }
    .bid-form { display: flex; gap: 8px; }
    .bid-form input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    .bid-form button, .btn-message {
      padding: 10px 20px;
      background: #CC0000;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .bid-form button:disabled, .btn-message:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .current-bid { color: #CC0000; font-weight: 600; }
    .bid-end { color: #666; font-size: 0.9rem; margin: 0 0 0.5rem; }
    .bid-hint { color: #666; font-size: 0.85rem; margin-bottom: 0.5rem; }
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      min-height: 80px;
      font-size: 1rem;
      resize: vertical;
      box-sizing: border-box;
      margin-bottom: 8px;
    }
    .success {
      background: #efe;
      color: #060;
      padding: 10px;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .error {
      background: #fee;
      color: #c00;
      padding: 10px;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .owner-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .btn-edit {
      flex: 1;
      padding: 10px 20px;
      background: #003366;
      color: white;
      border: none;
      border-radius: 6px;
      text-align: center;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete {
      flex: 1;
      padding: 10px 20px;
      background: white;
      color: #CC0000;
      border: 2px solid #CC0000;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete:hover { background: #CC0000; color: white; }
    .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
    .sold-section, .sold-summary, .review-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .sold-form, .review-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .sold-form select, .review-form select {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      background: white;
    }
    .star-rating {
      display: flex;
      gap: 0.35rem;
      align-items: center;
    }
    .star-button {
      border: none;
      background: transparent;
      padding: 0;
      font-size: 2rem;
      line-height: 1;
      color: #cfcfcf;
      cursor: pointer;
      transition: transform 0.15s ease, color 0.15s ease;
    }
    .star-button:hover {
      transform: scale(1.08);
    }
    .star-button.active {
      color: #f4b400;
    }
    .rating-label {
      margin: 0;
      color: #555;
      font-size: 0.95rem;
    }
    .btn-sold, .btn-review {
      padding: 10px 20px;
      background: #003366;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-sold:disabled, .btn-review:disabled { opacity: 0.6; cursor: not-allowed; }
    .section-note {
      color: #555;
      margin: 0 0 0.75rem;
      line-height: 1.5;
    }
    .sold-summary-note {
      margin: 0.5rem 0 0;
      color: #003366;
      font-weight: 500;
      line-height: 1.5;
    }
    .listing-meta { margin-top: 1.5rem; color: #999; font-size: 0.85rem; }
    .listing-meta p { margin: 2px 0; }

    .report-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }
    .report-section h4 { margin: 0 0 0.75rem; font-size: 1rem; }
    .report-section label {
      display: block;
      font-size: 0.85rem;
      color: #555;
      margin-bottom: 4px;
      margin-top: 0.5rem;
    }
    .report-section select,
    .report-section textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: inherit;
      box-sizing: border-box;
    }
    .report-section textarea {
      min-height: 70px;
      resize: vertical;
    }
    .report-actions {
      display: flex;
      gap: 8px;
      margin-top: 0.75rem;
    }
    .btn-report-link {
      background: transparent;
      border: none;
      color: #888;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 4px 0;
      text-decoration: underline;
    }
    .btn-report-link:hover { color: #CC0000; }
    .btn-report-submit {
      padding: 8px 16px;
      background: #CC0000;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-report-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .report-section .btn-secondary {
      padding: 8px 16px;
      background: #fff;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .report-section .btn-secondary:hover { background: #f5f5f5; }
    .report-thanks {
      color: #060;
      background: #efe;
      padding: 10px;
      border-radius: 6px;
      margin: 0;
    }
    @media (max-width: 768px) {
      .detail-container { grid-template-columns: 1fr; }
    }
  `]
})
export class ListingDetailComponent implements OnInit, OnDestroy {
  listing?: Listing;
  currentImageIndex = 0;
  imageFailed = false;
  bidAmount?: number;
  messageContent = '';
  successMsg = '';
  errorMsg = '';
  loading = true;
  bidding = false;
  sending = false;
  deleting = false;
  markingSold = false;
  submittingReview = false;
  eligibleBuyers: EligibleBuyer[] = [];
  selectedBuyerId?: number;
  reviewEligibility?: ReviewEligibility;
  reviewRating = 5;
  reviewComment = '';
  readonly stars = [1, 2, 3, 4, 5];

  // Report state
  showReportForm = false;
  reportSubmitted = false;
  submittingReport = false;
  reportReason: ReportReason = 'inappropriate';
  reportDescription = '';

  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingsService: ListingsService,
    private bidsService: BidsService,
    private messagesService: MessagesService,
    private reviewsService: ReviewsService,
    private reportsService: ReportsService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (isNaN(id)) {
        this.loading = false;
        this.errorMsg = 'Invalid listing ID';
        return;
      }
      this.loadListing(id);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  loadListing(id: number) {
    this.loading = true;
    this.errorMsg = '';
    this.imageFailed = false;
    this.currentImageIndex = 0;
    this.showReportForm = false;
    this.reportSubmitted = false;
    this.reportDescription = '';
    this.reportReason = 'inappropriate';
    this.listingsService.getListing(id).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.loading = false;
        this.selectedBuyerId = undefined;
        this.loadEligibleBuyers();
        this.loadReviewEligibility();
      },
      error: () => {
        this.errorMsg = 'Listing not found';
        this.loading = false;
      },
    });
  }

  isOwner(): boolean {
    return !!this.listing && this.auth.isLoggedIn && this.listing.seller.id === this.auth.currentUser?.id;
  }

  loadEligibleBuyers() {
    if (!this.listing || !this.isOwner() || this.listing.status !== 'active') {
      this.eligibleBuyers = [];
      return;
    }

    this.listingsService.getEligibleBuyers(this.listing.id).subscribe({
      next: (buyers) => {
        this.eligibleBuyers = buyers;
      },
      error: () => {
        this.eligibleBuyers = [];
      },
    });
  }

  loadReviewEligibility() {
    if (!this.listing || !this.auth.isLoggedIn || this.listing.status !== 'sold') {
      this.reviewEligibility = undefined;
      return;
    }

    this.reviewsService.getEligibility(this.listing.id).subscribe({
      next: (eligibility) => {
        this.reviewEligibility = eligibility;
      },
      error: () => {
        this.reviewEligibility = undefined;
      },
    });
  }

  deleteListing() {
    if (!this.listing || !confirm(`Are you sure you want to delete "${this.listing.title}"?`)) return;
    this.deleting = true;
    this.listingsService.deleteListing(this.listing.id).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to delete listing';
        this.deleting = false;
      },
    });
  }

  markSold() {
    if (!this.listing || !this.selectedBuyerId) {
      this.errorMsg = 'Please select a buyer';
      return;
    }

    this.errorMsg = '';
    this.successMsg = '';
    this.markingSold = true;
    this.listingsService.markSold(this.listing.id, this.selectedBuyerId).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.markingSold = false;
        this.successMsg = 'Listing marked as sold';
        this.loadReviewEligibility();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to mark listing as sold';
        this.markingSold = false;
      },
    });
  }

  setReviewRating(star: number) {
    this.reviewRating = star;
  }

  getReviewRatingLabel() {
    switch (this.reviewRating) {
      case 5:
        return '5 stars - Excellent';
      case 4:
        return '4 stars - Good';
      case 3:
        return '3 stars - Average';
      case 2:
        return '2 stars - Poor';
      default:
        return '1 star - Bad';
    }
  }

  getMinBidAmount(): number {
    if (this.listing?.bids && this.listing.bids.length > 0) {
      return Number(this.listing.bids[0].amount) + 0.01;
    }
    return Number(this.listing?.price || 0) + 0.01;
  }

  isBiddingExpired(): boolean {
    if (!this.listing?.bidEndDate) return false;
    return new Date(this.listing.bidEndDate) < new Date();
  }

  placeBid() {
    if (!this.listing || this.bidAmount === undefined || this.bidAmount === null || this.bidAmount <= 0) {
      this.errorMsg = 'Please enter a valid bid amount';
      return;
    }
    this.errorMsg = '';
    this.successMsg = '';
    this.bidding = true;
    this.bidsService.placeBid(this.listing.id, this.bidAmount).subscribe({
      next: () => {
        this.successMsg = 'Bid placed successfully!';
        this.bidding = false;
        this.loadListing(this.listing!.id);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to place bid';
        this.bidding = false;
      },
    });
  }

  sendMessage() {
    if (!this.listing || !this.messageContent?.trim()) {
      this.errorMsg = 'Please enter a message';
      return;
    }
    this.errorMsg = '';
    this.successMsg = '';
    this.sending = true;
    this.messagesService
      .sendMessage({
        listingId: this.listing.id,
        receiverId: this.listing.seller.id,
        content: this.messageContent.trim(),
      })
      .subscribe({
        next: () => {
          this.successMsg = 'Message sent!';
          this.messageContent = '';
          this.sending = false;
        },
        error: () => {
          this.errorMsg = 'Failed to send message';
          this.sending = false;
        },
      });
  }

  submitReview() {
    if (!this.listing || !this.reviewEligibility?.canReview || !this.reviewEligibility.reviewedId) {
      this.errorMsg = this.reviewEligibility?.reason || 'Review is not available';
      return;
    }

    this.errorMsg = '';
    this.successMsg = '';
    this.submittingReview = true;
    this.reviewsService.createReview({
      reviewedId: this.reviewEligibility.reviewedId,
      listingId: this.listing.id,
      rating: this.reviewRating,
      comment: this.reviewComment.trim() || undefined,
    }).subscribe({
      next: () => {
        this.successMsg = 'Review submitted successfully';
        this.reviewComment = '';
        this.submittingReview = false;
        this.loadListing(this.listing!.id);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to submit review';
        this.submittingReview = false;
      },
    });
  }

  submitReport() {
    if (!this.listing) return;
    this.submittingReport = true;
    this.errorMsg = '';
    this.reportsService
      .createReport({
        listingId: this.listing.id,
        reason: this.reportReason,
        description: this.reportDescription.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.reportSubmitted = true;
          this.submittingReport = false;
        },
        error: (err) => {
          this.submittingReport = false;
          const msg = err.error?.message;
          this.errorMsg =
            (Array.isArray(msg) ? msg[0] : msg) || 'Could not submit report';
        },
      });
  }
}
