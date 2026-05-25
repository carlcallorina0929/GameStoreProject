import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAdminRequest = req.url.includes('/api/admin/');
  const tokenKey = isAdminRequest ? 'admin_token' : 'token';
  const token = localStorage.getItem(tokenKey);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
