import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only attach token to our own API requests
  if (req.url.startsWith(environment.apiUrl)) {
    const token = sessionStorage.getItem('token');
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }
  return next(req).pipe(
    tap({
      error: (err) => {
        if (err.status === 401 && !req.url.includes('/auth/login')) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
        }
      },
    }),
  );
};
