import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { SessionUser, UserProfile, LoginResponse } from '@campusexchange/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<SessionUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    try {
      const stored = sessionStorage.getItem('user');
      if (stored) {
        this.currentUserSubject.next(JSON.parse(stored));
      }
    } catch {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  }

  get currentUser(): SessionUser | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return sessionStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, data);
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        sessionStorage.setItem('token', res.accessToken);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  verifyOtp(email: string, otp: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/verify-otp`, { email, otp }).pipe(
      tap((res) => {
        sessionStorage.setItem('token', res.accessToken);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }
}
