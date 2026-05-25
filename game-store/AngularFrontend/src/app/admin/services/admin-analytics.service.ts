import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type SummaryResponse = {
  totalUsers: number;
  totalGames: number;
  totalOrders: number;
  totalRevenue: number;
};

type ChartsResponse = {
  salesVolume: Array<{
    sale_date: string;
    orders_count: number;
    revenue: number;
  }>;
  topSellingGames: Array<{
    game_id: number;
    title: string;
    units_sold: number;
    revenue: number;
  }>;
  registrationTrends: Array<{
    register_date: string;
    registrations: number;
  }>;
  topFreeGames: Array<{
    game_id: number;
    title: string;
    owners_count: number;
  }>;
};

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private apiUrl = `${environment.apiUrl}/admin/analytics`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(`${this.apiUrl}/summary`);
  }

  getCharts(): Observable<ChartsResponse> {
    return this.http.get<ChartsResponse>(`${this.apiUrl}/charts`);
  }
}
