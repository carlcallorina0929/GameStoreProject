import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './services/auth.service';

// The JWT lives in an httpOnly cookie, so the browser cannot read it.
// The guard verifies the session by calling the authenticated /users/me endpoint.
export const userAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.getCurrentUser().pipe(
    map(() => true),
    catchError(() => {
      router.navigateByUrl('/auth-landing');
      return of(false);
    })
  );
};