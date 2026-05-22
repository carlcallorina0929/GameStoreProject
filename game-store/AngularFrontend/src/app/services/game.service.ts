import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { DiscountedGameApiResponse, Game, GameCatalogApiResponse, GameCatalogItem } from '../models/game';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fetch all games for the currently logged-in user.
  // The authInterceptor automatically attaches the JWT token.
  getGames(): Observable<GameCatalogItem[]> {
    return this.http.get<GameCatalogApiResponse[]>(`${this.apiUrl}/games`).pipe(
      map((games) =>
        games.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          price: g.price,
          imageUrl: g.image_url,
          genres: (g.genres ?? '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          isOwned: Boolean(g.is_owned),
        }))
      )
    );
  }

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
