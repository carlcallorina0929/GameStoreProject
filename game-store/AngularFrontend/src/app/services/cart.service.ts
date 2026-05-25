import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from  '../environments/environment';
import {Observable} from 'rxjs';
import {CartItem} from '../models/cart';
import {ApiResponse} from '../models/cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
    private apiUrl = environment.apiUrl;
    constructor(private http: HttpClient) {}

getCart(): Observable<CartItem[]> {
  return this.http.get<CartItem[]>(`${this.apiUrl}/cart`);
}
addToCart(gameId: number): Observable<ApiResponse> {
  return this.http.post<ApiResponse>(`${this.apiUrl}/cart/add`, { gameId });
}
removeFromCart(gameId: number): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/cart/remove/${gameId}`,
    {}
  );
}

}