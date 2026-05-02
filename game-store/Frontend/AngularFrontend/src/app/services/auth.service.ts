import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from  '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials);
  }

  register(userData: {
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, userData);
  }

  checkUsernameAvailability(username: string): Observable<{ available: boolean }> {
  return this.http.get<{ available: boolean }>(
    `${this.apiUrl}/users/check-username`,
    { params: { username } }
  );
}

checkEmailAvailability(email: string): Observable<{ available: boolean }> {
  return this.http.get<{ available: boolean }>(
    `${this.apiUrl}/users/check-email`,
    { params: { email } }
  );
}

storeUserId(userId: string): void {
    localStorage.setItem('userId', userId);
  }
}
