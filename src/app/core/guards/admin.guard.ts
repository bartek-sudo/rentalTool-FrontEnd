import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const isLogged = authService.isLogged();

  if (!isLogged) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const user = authService.currentUser();
  const hasAdminRole = user?.userType === 'ADMIN';

  if (hasAdminRole) {
    return true;
  } else {
    router.navigate(['/tools']);
    return false;
  }
};
