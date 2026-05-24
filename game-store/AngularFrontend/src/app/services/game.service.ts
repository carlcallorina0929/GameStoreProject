import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { DiscountedGameApiResponse, Game, GameCatalogApiResponse, GameCatalogItem } from '../models/game';
import { Category } from '../models/category';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
  return this.http.get<Category[]>(`${this.apiUrl}/games/genres`);
}

  // Fetch all games for the currently logged-in user.
  // The authInterceptor automatically attaches the JWT token.
getGames(genre?: string): Observable<GameCatalogItem[]> {
  let url = `${this.apiUrl}/games`;

  if (genre) {
    url += `?genre=${encodeURIComponent(genre)}`;
  }

  return this.http.get<GameCatalogApiResponse[]>(url).pipe(
    map((games) =>
      games.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        originalPrice: g.price,
        finalPrice: g.final_price,
        imageUrl: g.image_url,
        genres: g.genres
          ? g.genres.split(',').map(x => x.trim()).filter(Boolean)
          : [],
        isOwned: Boolean(g.is_owned),
        isInCart: Boolean(g.is_in_cart),
        discountPercent: Number(g.discount_percent ?? 0) || 0
      }))
    )
  );
}

  // Fetch discounted games for the currently logged-in user.
  // The authInterceptor automatically attaches the JWT token.
  getDiscountedGames(): Observable<Game[]> {
    return this.http.get<DiscountedGameApiResponse[]>(`${this.apiUrl}/games/discounted-games`).pipe(
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
          isOwned: g.is_owned,
          isInCart: g.is_in_cart
        }))
      )
    );
  }
}

