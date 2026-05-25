import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AdminUserRecord = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  created_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminUsersResponse = {
  data: AdminUserRecord[];
  pagination: Pagination;
};

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getUsers(query: {
    page: number;
    limit: number;
    includeInactive: boolean;
    search: string;
  }): Observable<AdminUsersResponse> {
    const params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeInactive', query.includeInactive)
      .set('search', query.search ?? '');
    return this.http.get<AdminUsersResponse>(this.apiUrl, { params });
  }

  createUser(payload: {
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    email: string;
    password: string;
    role: 'user' | 'admin';
  }) {
    return this.http.post(this.apiUrl, payload);
  }

  updateUser(id: number, payload: Record<string, unknown>) {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  softDeleteUser(id: number) {
    return this.http.patch(`${this.apiUrl}/${id}/soft-delete`, {});
  }
}
