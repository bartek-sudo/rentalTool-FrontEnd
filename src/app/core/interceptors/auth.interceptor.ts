import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HttpResponse } from '../models/http-response.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();

  if (token) {
    req = req.clone({
      withCredentials: true,
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    req = req.clone({
      withCredentials: true,
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 || err.status === 403) {
        // Backend zwraca teraz HttpResponse JSON zamiast pustej odpowiedzi
        // Angular automatycznie parsuje JSON do err.error
        const errorResponse = err.error as HttpResponse | undefined;
        if (errorResponse?.message) {
          console.warn(`Authentication error (${err.status}):`, errorResponse.message);
        }

        // Lista publicznych endpointów, które nie wymagają przekierowania na login
        const publicEndpoints = [
          '/auth/me',
          '/tools/search',
          '/tools/'
        ];

        // Sprawdź czy to publiczny endpoint
        const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

        if (!isPublicEndpoint) {
          tokenService.destroyToken();
          // Sprawdź czy nie jesteśmy już na stronie logowania
          if (router.url !== '/login') {
            router.navigate(['/login']);
          }
        }
      }
      return throwError(() => err);
    })
  );
};
