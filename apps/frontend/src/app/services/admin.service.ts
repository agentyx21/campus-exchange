import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Report {
  id: number;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporter: { id: number; firstName: string; lastName: string };
  listing: { id: number; title: string; seller: { id: number; firstName: string; lastName: string } };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private reportsUrl = `${environment.apiUrl}/reports`;
  private usersUrl = `${environment.apiUrl}/users`;
  private listingsUrl = `${environment.apiUrl}/listings`;

  constructor(private http: HttpClient) {}

  getPendingReports() {
    return this.http.get<Report[]>(`${this.reportsUrl}/pending`);
  }

  reviewReport(reportId: number, action: string) {
    return this.http.put(`${this.reportsUrl}/${reportId}/${action}`, {});
  }

  banUser(userId: number) {
    return this.http.put(`${this.usersUrl}/${userId}/ban`, {});
  }

  unbanUser(userId: number) {
    return this.http.put(`${this.usersUrl}/${userId}/unban`, {});
  }

  adminDeleteListing(listingId: number) {
    return this.http.delete(`${this.listingsUrl}/${listingId}/admin`);
  }
}
