import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminAuthService } from './services/admin-auth.service';

// The admin JWT lives in an httpOnly cookie, so the browser cannot read it.
// The guard verifies the session by calling the authenticated /admin/auth/me endpoint.
export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AdminAuthService);

  return authService.checkSession().pipe(
    map(() => true),
    catchError(() => {
      router.navigateByUrl('/admin/login');
      return of(false);
    })
  );
};