import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface SettingsTransaction {
  id: number;
  order_id: number;
  total_paid: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  card_last4: string | null;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
  games_bought: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<{ transactions: SettingsTransaction[] }> {
    return this.http.get<{ transactions: SettingsTransaction[] }>(
      `${this.apiUrl}/settings/transactions`
    );
  }
}
