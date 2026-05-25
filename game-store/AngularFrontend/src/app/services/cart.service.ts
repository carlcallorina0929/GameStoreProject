import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from  '../environments/environment';
import {Observable} from 'rxjs';
import {CartItem} from '../models/cart';
import {ApiResponse} from '../models/cart';
import {map} from 'rxjs/operators';
import { CheckoutPayment, CheckoutResponse } from './checkout.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
    private apiUrl = environment.apiUrl;
    constructor(private http: HttpClient) {}

getCart(): Observable<CartItem[]> {
  return this.http.get<any[]>(`${this.apiUrl}/cart`).pipe(
    map(items =>
      items.map(item => ({
        game_id: item.game_id,
        title: item.title,
        image_url: item.image_url,
        discount_percent:Number(item.discount_percent),
        price: Number(item.price),
        final_price: Number(item.final_price)
      }))
    )
  );
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

processCheckout(payment: CheckoutPayment) : Observable<CheckoutResponse> {
  return this.http.post<CheckoutResponse>(`${this.apiUrl}/checkout/process`, payment);
}

}