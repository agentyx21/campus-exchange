import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'scam'
  | 'prohibited_item'
  | 'other';

export interface CreateReportRequest {
  listingId: number;
  reason: ReportReason;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  createReport(data: CreateReportRequest) {
    return this.http.post<{ message: string }>(this.apiUrl, data);
  }
}
