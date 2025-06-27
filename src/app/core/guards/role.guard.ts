import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Pobierz wymagane role z danych routa
  const requiredRoles = route.data['roles'] as string[] || [];

  const isLogged = authService.isLogged();

  if (!isLogged) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (requiredRoles.length === 0) {
    return true; // Brak wymaganych ról - dostęp dla wszystkich zalogowanych
  }

  const userRoles = tokenService.getRoles();
  const hasRequiredRole = requiredRoles.some(role =>
    userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
  );

  if (hasRequiredRole) {
    return true;
  } else {
    router.navigate(['/tools']);
    return false;
  }
};
