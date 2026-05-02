import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = 'https://game-store-project-yraf.vercel.app';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  register(userData: {
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  checkUsernameAvailability(username: string): Observable<{ available: boolean }> {
  return this.http.get<{ available: boolean }>(
    `${this.apiUrl}/check-username`,
    { params: { username } }
  );
}

checkEmailAvailability(email: string): Observable<{ available: boolean }> {
  return this.http.get<{ available: boolean }>(
    `${this.apiUrl}/check-email`,
    { params: { email } }
  );
}

storeUserId(userId: string): void {
    localStorage.setItem('userId', userId);
  }
}
