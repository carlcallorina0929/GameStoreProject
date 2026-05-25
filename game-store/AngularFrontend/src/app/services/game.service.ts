import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { DiscountedGameApiResponse, Game, GameCatalogApiResponse, GameCatalogItem } from '../models/game';
import { Category } from '../models/category';
import { GameFilterState } from '../models/game-filter';


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
getGames(filters?: GameFilterState): Observable<GameCatalogItem[]> {
  const paramsBuilder = new HttpParams()
    .set('search', filters?.search?.trim() ?? '')
    .set('genre', filters?.genre ?? '')
    .set('price', filters?.price ?? 'all')
    .set('sort', filters?.sort ?? 'az');

  const params = Object.fromEntries(
    Array.from(paramsBuilder.keys())
      .map(key => [key, paramsBuilder.get(key)])
      .filter(([, value]) => value !== '' && value !== null)
  );

  return this.http.get<GameCatalogApiResponse[]>(`${this.apiUrl}/games`, {
    params: new HttpParams({ fromObject: params as Record<string, string> })
  }).pipe(
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

