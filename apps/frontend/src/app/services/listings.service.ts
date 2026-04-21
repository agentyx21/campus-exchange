import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Listing, ListingsResponse, Category, CreateListingRequest, UpdateListingRequest, EligibleBuyer } from '@campusexchange/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ListingsService {
  private apiUrl = `${environment.apiUrl}/listings`;
  private categories$?: Observable<Category[]>;

  constructor(private http: HttpClient) {}

  getCategories() {
    if (!this.categories$) {
      this.categories$ = this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
        shareReplay(1),
      );
    }
    return this.categories$;
  }

  getListings(params: {
    category?: number;
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {}) {
    let httpParams = new HttpParams();
    if (params.category) httpParams = httpParams.set('category', params.category.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ListingsResponse>(this.apiUrl, { params: httpParams });
  }

  getMyListings() {
    return this.http.get<Listing[]>(`${this.apiUrl}/my-listings`);
  }

  getListing(id: number) {
    return this.http.get<Listing>(`${this.apiUrl}/${id}`);
  }

  createListing(data: CreateListingRequest) {
    return this.http.post<Listing>(this.apiUrl, data);
  }

  updateListing(id: number, data: UpdateListingRequest) {
    return this.http.put<Listing>(`${this.apiUrl}/${id}`, data);
  }

  getEligibleBuyers(id: number) {
    return this.http.get<EligibleBuyer[]>(`${this.apiUrl}/${id}/eligible-buyers`);
  }

  markSold(id: number, buyerId: number) {
    return this.http.put<Listing>(`${this.apiUrl}/${id}/mark-sold`, { buyerId });
  }

  deleteListing(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  endAuction(id: number) {
    return this.http.put<Listing>(`${this.apiUrl}/${id}/end-auction`, {});
  }
}
