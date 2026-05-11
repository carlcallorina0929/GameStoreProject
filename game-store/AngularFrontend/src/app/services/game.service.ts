import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { DiscountedGameApiResponse, Game } from '../models/game';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fetch discounted games for the currently logged-in user.
  // The authInterceptor automatically attaches the JWT token.
  getDiscountedGames(): Observable<Game[]> {
    return this.http.get<DiscountedGameApiResponse[]>(`${this.apiUrl}/discounted-games`).pipe(
      // Convert snake_case (backend) -> camelCase (frontend)
      map((games) =>
        games.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          originalPrice: g.price,
          imageUrl: g.image_url,
          discountPercent: g.discount_percent,
          discountStart: g.discount_start,
          discountEnd: g.discount_end,
          finalPrice: g.final_price,
          isOwned: g.is_owned
        }))
      )
    );
  }
}

