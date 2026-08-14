import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type LoginPayload = {
  username: string;
  password: string;
};

type AdminLoginResponse = {
  user: {
    id: number;
    username: string;
    role: 'admin';
  };
};

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private apiUrl = `${environment.apiUrl}/admin/auth`;

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/login`, payload);
  }

  checkSession(): Observable<AdminLoginResponse> {
    return this.http.get<AdminLoginResponse>(`${this.apiUrl}/me`);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }
}