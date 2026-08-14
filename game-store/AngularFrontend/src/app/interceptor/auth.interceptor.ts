import { HttpInterceptorFn } from '@angular/common/http';

// JWT is stored in httpOnly cookies by the backend.
// Sending credentials (cookies) on every request lets the browser attach them
// automatically — no Authorization header needed.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};