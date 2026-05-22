// This interface describes the "clean" shape we want to use in Angular.
// We map backend snake_case fields -> frontend camelCase fields in the service.
export interface Game {
  id: number;
  title: string;
  description: string;

  // Backend: price
  originalPrice: number;

  // Backend: image_url (already a full URL from the backend)
  imageUrl: string | null;

  // Backend: discount_percent
  discountPercent: number;

  // Backend: discount_start / discount_end (can be null for permanent discounts)
  discountStart: string | null;
  discountEnd: string | null;

  // Backend: final_price (calculated in SQL)
  finalPrice: number;

  // Backend: is_owned (computed per logged-in user)
  isOwned: boolean;
}

// This interface matches the backend JSON response exactly (snake_case).
// Keeping it separate makes the mapping step very beginner-friendly.
export interface DiscountedGameApiResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  discount_percent: number;
  discount_start: string | null;
  discount_end: string | null;
  final_price: number;
  is_owned: boolean;
}

// "All games" catalog response (snake_case) from GET /api/games.
export interface GameCatalogApiResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  genres: string | null;
  is_owned: boolean | 0 | 1;
}

// Clean shape used by the games list component.
export interface GameCatalogItem {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  genres: string[];
  isOwned: boolean;
}
