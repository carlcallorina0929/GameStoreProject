export interface LibraryGameItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  purchasedAt: string;
}
