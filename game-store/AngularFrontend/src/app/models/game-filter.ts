export type PriceFilter = 'all' | 'free' | 'paid' | 'discounted';
export type SortFilter = 'az' | 'price_asc' | 'price_desc' | 'most_discounted' | 'newest';

export interface GameFilterState {
  search: string;
  genre: string | null;
  price: PriceFilter;
  sort: SortFilter;
}
