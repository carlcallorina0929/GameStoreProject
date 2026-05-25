import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

type JwtPayload = {
  exp?: number;
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

export const userAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigateByUrl('/auth-landing');
    return false;
  }

  const payload = parseJwtPayload(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (!payload || (payload.exp && payload.exp < nowInSeconds)) {
    localStorage.removeItem('token');
    router.navigateByUrl('/auth-landing');
    return false;
  }

  return true;
};
