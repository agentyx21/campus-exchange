import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, Report } from '../../services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="admin-page">
      <div class="admin-container">
        <h2>Admin Dashboard</h2>
        <p class="subtitle">Review reported listings</p>

        <div class="reports-list">
          @if (errorMsg) {
            <div class="error">{{ errorMsg }}</div>
          }
          @if (loading) {
            <p class="empty">Loading reports...</p>
          } @else {
          @for (report of reports; track report.id) {
            <div class="report-card">
              <div class="report-header">
                <span class="report-reason">{{ report.reason }}</span>
                <span class="report-date">{{ report.createdAt | date:'short' }}</span>
              </div>
              <p class="report-listing"><strong>Listing:</strong> {{ report.listing.title }}</p>
              <p class="report-seller"><strong>Seller:</strong> {{ report.listing.seller.firstName }} {{ report.listing.seller.lastName }}</p>
              @if (report.description) {
                <p class="report-desc">{{ report.description }}</p>
              }
              <p class="report-reporter"><strong>Reported by:</strong> {{ report.reporter.firstName }} {{ report.reporter.lastName }}</p>
              <div class="report-actions">
                <button class="btn-dismiss" (click)="reviewReport(report.id, 'dismissed')">Dismiss</button>
                <button class="btn-approve" (click)="reviewReport(report.id, 'reviewed')">Remove Listing</button>
              </div>
            </div>
          } @empty {
            <div class="empty">
              <p>No pending reports. All clear!</p>
            </div>
          }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: calc(100vh - 64px);
      background: #f8f9fa;
      padding: 2rem;
    }
    .admin-container { max-width: 800px; margin: 0 auto; }
    h2 { margin: 0 0 0.3rem; }
    .subtitle { color: #666; margin-bottom: 2rem; }
    .report-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      margin-bottom: 1rem;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .report-reason {
      background: #fee;
      color: #c00;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .report-date { color: #999; font-size: 0.85rem; }
    .report-listing, .report-seller, .report-reporter {
      margin: 4px 0;
      font-size: 0.95rem;
    }
    .report-desc {
      color: #555;
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 8px 0;
    }
    .report-actions {
      display: flex;
      gap: 8px;
      margin-top: 1rem;
    }
    .btn-dismiss {
      padding: 8px 20px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }
    .btn-approve {
      padding: 8px 20px;
      background: #CC0000;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .empty { text-align: center; color: #999; padding: 3rem; }
    .error { background: #fee; color: #c00; padding: 12px; border-radius: 8px; margin-bottom: 1rem; }
  `]
})
export class AdminComponent implements OnInit {
  reports: Report[] = [];
  loading = true;
  errorMsg = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getPendingReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.status === 403 ? 'Access denied. Admin only.' : 'Failed to load reports.';
        this.loading = false;
      },
    });
  }

  reviewReport(reportId: number, action: string) {
    this.adminService.reviewReport(reportId, action).subscribe({
      next: () => {
        this.reports = this.reports.filter((r) => r.id !== reportId);
      },
      error: () => {
        this.errorMsg = 'Failed to update report. Please try again.';
      },
    });
  }
}
