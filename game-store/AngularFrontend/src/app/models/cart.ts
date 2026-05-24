export interface CartApiResponse {
  game_id: number;
  title: string;
  image_url: string | null;
  discount_percent?: number;
  final_price?: number;
}

export interface CartItem {
  gameId: number;
  title: string;
  imageUrl: string | null;
  finalPrice: number;
}