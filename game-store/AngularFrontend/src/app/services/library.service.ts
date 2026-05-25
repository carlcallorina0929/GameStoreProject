import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { LibraryGameItem } from '../models/library-item';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLibrary(userId: number): Observable<LibraryGameItem[]> {
    return this.http.get<any[]>(`${this.apiUrl}/library/${userId}`).pipe(
      map((items) =>
        items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          originalPrice: Number(item.originalPrice),
          finalPrice: Number(item.finalPrice),
          discountPercent: Number(item.discountPercent || 0),
          purchasedAt: item.purchasedAt
        }))
      )
    );
  }

  addToLibrary(gameId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/library/add`, { gameId });
  }

  addFromOrder(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/library/from-order`, { orderId });
  }
}
