import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Bid } from '@campusexchange/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BidsService {
  private apiUrl = `${environment.apiUrl}/bids`;

  constructor(private http: HttpClient) {}

  placeBid(listingId: number, amount: number) {
    return this.http.post<Bid>(this.apiUrl, { listingId, amount });
  }

  getBidsByListing(listingId: number) {
    return this.http.get<Bid[]>(`${this.apiUrl}/listing/${listingId}`);
  }

  getMyBids() {
    return this.http.get<Bid[]>(`${this.apiUrl}/my-bids`);
  }
}
