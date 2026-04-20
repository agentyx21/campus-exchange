import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReviewEligibility } from '@campusexchange/shared';
import { environment } from '../../environments/environment';

interface Review {
  id: number;
  reviewedId: number;
  listingId: number;
  rating: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getUserReviews(userId: number) {
    return this.http.get<Review[]>(`${this.apiUrl}/user/${userId}`);
  }

  getEligibility(listingId: number) {
    return this.http.get<ReviewEligibility>(`${this.apiUrl}/eligibility/${listingId}`);
  }

  createReview(data: {
    reviewedId: number;
    listingId: number;
    rating: number;
    comment?: string;
  }) {
    return this.http.post<Review>(this.apiUrl, data);
  }
}
