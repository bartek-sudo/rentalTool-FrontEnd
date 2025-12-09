import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Sprawdź czy użytkownik jest już zalogowany
  const isLogged = authService.isLogged();
  
  if (isLogged) {
    return true;
  } else {
    // Jeśli użytkownik nie jest jeszcze załadowany, spróbuj pobrać informacje
    // Cookie może być HttpOnly i nie być dostępne dla JS, ale zostanie wysłane z żądaniem
    return authService.getUserInfo().pipe(
      map(() => true),
      catchError((error) => {
        // Jeśli nie udało się załadować (401/403), przekieruj do logowania
        if (error.status === 401 || error.status === 403) {
          router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        }
        return of(false);
      })
    );
  }
};
