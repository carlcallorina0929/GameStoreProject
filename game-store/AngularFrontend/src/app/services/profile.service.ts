import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ProfileUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string;
  role: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<{ user: ProfileUser }> {
    return this.http.get<{ user: ProfileUser }>(`${this.apiUrl}/profile`);
  }

  updateProfile(payload: {
    username?: string;
    email?: string;
  }): Observable<{ message: string; user: ProfileUser }> {
    return this.http.put<{ message: string; user: ProfileUser }>(
      `${this.apiUrl}/profile`,
      payload
    );
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/profile/password`,
      payload
    );
  }
}

