import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AdminGameRecord = {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  discount_percent: number;
  discount_start: string | null;
  discount_end: string | null;
  isActive: boolean;
  created_at: string;
  genres?: string | null;
  genre_ids?: string | null;
};
export type GameGenre = { id: number; name: string };

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminGamesResponse = {
  data: AdminGameRecord[];
  pagination: Pagination;
};

@Injectable({ providedIn: 'root' })
export class AdminGamesService {
  private apiUrl = `${environment.apiUrl}/admin/games`;

  constructor(private http: HttpClient) {}

  getGames(query: {
    page: number;
    limit: number;
    includeInactive: boolean;
    search: string;
  }): Observable<AdminGamesResponse> {
    const params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeInactive', query.includeInactive)
      .set('search', query.search ?? '');
    return this.http.get<AdminGamesResponse>(this.apiUrl, { params });
  }

  createGame(payload: FormData): Observable<unknown> {
    return this.http.post(this.apiUrl, payload);
  }

  getGenres(): Observable<GameGenre[]> {
    return this.http.get<GameGenre[]>(`${this.apiUrl}/genres`);
  }

  updateGame(id: number, payload: FormData): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  softDeleteGame(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/soft-delete`, {});
  }
}
