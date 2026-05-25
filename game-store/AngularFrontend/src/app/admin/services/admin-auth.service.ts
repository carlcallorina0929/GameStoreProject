import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type LoginPayload = {
  username: string;
  password: string;
};

type AdminLoginResponse = {
  token: string;
  user: {
    id: number;
    username: string;
    role: 'admin';
  };
};

type JwtPayload = {
  exp?: number;
  role?: string;
};

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private apiUrl = `${environment.apiUrl}/admin/auth`;

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/login`, payload);
  }

  storeToken(token: string): void {
    localStorage.setItem('admin_token', token);
  }

  clearToken(): void {
    localStorage.removeItem('admin_token');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;

    const payload = this.parseJwtPayload(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!payload || payload.role !== 'admin') return false;

    return !payload.exp || payload.exp >= nowInSeconds;
  }

  private parseJwtPayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}
