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
  listing: { id: number; title: string; seller: { firstName: string; lastName: string } };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getPendingReports() {
    return this.http.get<Report[]>(`${this.apiUrl}/pending`);
  }

  reviewReport(reportId: number, action: string) {
    return this.http.put(`${this.apiUrl}/${reportId}/${action}`, {});
  }
}
