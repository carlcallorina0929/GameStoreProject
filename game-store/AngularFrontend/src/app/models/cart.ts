
export interface CartItem {
  game_id: number;
  title: string;
  image_url: string;
  final_price: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}
