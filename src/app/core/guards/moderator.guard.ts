import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const moderatorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const isLogged = authService.isLogged();

  if (!isLogged) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const roles = tokenService.getRoles();
  const hasModeratorRole = roles.includes('MODERATOR') || roles.includes('ROLE_MODERATOR') ||
                          roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');

  if (hasModeratorRole) {
    return true;
  } else {
    router.navigate(['/tools']);
    return false;
  }
};
