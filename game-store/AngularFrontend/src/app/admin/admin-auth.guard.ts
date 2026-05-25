import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

type JwtPayload = {
  exp?: number;
  role?: string;
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

export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('admin_token');

  if (!token) {
    router.navigateByUrl('/admin/login');
    return false;
  }

  const payload = parseJwtPayload(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (!payload || payload.role !== 'admin' || (payload.exp && payload.exp < nowInSeconds)) {
    localStorage.removeItem('admin_token');
    router.navigateByUrl('/admin/login');
    return false;
  }

  return true;
};
