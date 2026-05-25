import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface CheckoutPayment {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

export interface CheckoutResponse {
  success: boolean;
  paymentStatus: 'paid' | 'failed';
  transactionReference?: string | null;
  orderId?: number;
  totalAmount?: number;
  itemCount?: number;
  error?: string;
  errorCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private http = inject(HttpClient);
  // use configured API base URL from environment to avoid relative-path issues
  private apiUrl = environment.apiUrl;

  /**
   * Process checkout payment
   */
  processCheckout(payment: CheckoutPayment, orderId?: number): Observable<CheckoutResponse> {
    const url = `${this.apiUrl}/checkout/process`;
    const payload: any = { ...payment };
    if (orderId) payload.orderId = orderId;
    console.log('Process checkout calling:', url, payload);

    return this.http.post<CheckoutResponse>(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap((res) => console.log('Checkout response:', res)),
      catchError((err) => {
        console.error('CheckoutService error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get order details
   */
  getOrder(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/order/${orderId}`);
  }

  /**
   * Create a pending order (snapshots cart items)
   */
  startCheckout(): Observable<{ success: boolean; orderId?: number; totalAmount?: number; itemCount?: number; error?: string }> {
    const url = `${this.apiUrl}/checkout/start`;
    return this.http.post<any>(url, {}, { headers: { 'Content-Type': 'application/json' } }).pipe(
      tap(res => console.log('startCheckout response:', res)),
      catchError((err) => {
        console.error('startCheckout error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Cancel a pending order
   */
  cancelCheckout(orderId: number) {
    const url = `${this.apiUrl}/checkout/cancel`;
    return this.http.post<any>(url, { orderId }, { headers: { 'Content-Type': 'application/json' } }).pipe(
      tap(res => console.log('cancelCheckout response:', res)),
      catchError((err) => {
        console.error('cancelCheckout error:', err);
        return throwError(() => err);
      })
    );
  }
}
