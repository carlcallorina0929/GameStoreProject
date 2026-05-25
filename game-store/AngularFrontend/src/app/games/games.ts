import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';
import { GameCatalogItem } from '../models/game';
import { GameFilterState } from '../models/game-filter';
import { finalize } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule , NzIconModule, NzButtonModule ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './games.html',
  styleUrl: './games.css'
})
export class GamesComponent implements OnInit , OnChanges {

  constructor(private gameService: GameService , private cartService: CartService , private notification: NzNotificationService) {}


  // STATE
  allGames = signal<GameCatalogItem[]>([]);
  filteredGames = signal<GameCatalogItem[]>([]);
  cart = signal<GameCatalogItem[]>([]);
  loading = signal(true);
  skeletonArray = Array(8);
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(8);
  selectedGame = signal<GameCatalogItem | null>(null);
  hasDiscount(game: GameCatalogItem): boolean {
    return game.finalPrice < game.originalPrice;
  }

  @Input() filters: GameFilterState | null = null;


  // INIT
  ngOnInit() {
    this.loadGames();
  }
 

ngOnChanges(changes: SimpleChanges) {
  if (changes['filters']) {
    this.loadGames();
  }
}

  getCartIcon(game: GameCatalogItem): string {
  if (game.isOwned) return 'crown';
  if (game.finalPrice === 0) return 'gift';
  if (game.isInCart) return 'check';
  return 'shopping-cart';
}

loadGames() {
  this.loading.set(true);

  this.gameService.getGames(this.filters ?? undefined)
    .pipe(
      finalize(() => {
        this.loading.set(false);
      })
    )
    .subscribe({
      next: (games) => {
        this.allGames.set(games);
        this.filteredGames.set(games);
        this.cart.set(games.filter(g => g.isInCart));
        this.currentPage.set(1);
      },
      error: (err) => {
        console.error(err);
      }
    });
}

  // CART LOGIC
  isGameInCart(gameId: number): boolean {
  return this.allGames().some(g => g.id === gameId && g.isInCart);
}

 toggleCart(game: GameCatalogItem, event: Event) {
  event.stopPropagation();

  if (game.isOwned || game.isInCart) return;

  this.cartService.addToCart(game.id).subscribe({
   next: () => {

  // update game state
  this.allGames.update(games =>
    games.map(g =>
      g.id === game.id ? { ...g, isInCart: true } : g
    )
  );

  this.filteredGames.update(games =>
    games.map(g =>
      g.id === game.id ? { ...g, isInCart: true } : g
    )
  );

  // ✅ IMPORTANT: update cart signal too
  this.cart.update(cart => [...cart, game]);

  this.notification.success(
    'Added to Cart',
    `${game.title} added successfully.`,
    {
      nzPlacement: 'bottomRight',
      nzDuration: 2500,
      nzClass: 'toast'
    }
  );
},

    error: (err) => {
      console.error(err);

      this.notification.error(
        'Cart Error',
        'Failed to add game to cart.',
        {
          nzPlacement: 'bottomRight'
        }
      );
    }
  });
}
  // DISABLE LOGIC
  isDisabled(game: GameCatalogItem): boolean {
    return game.isOwned || game.isInCart;
  }

  isSelectedGameInCart(): boolean {
    const g = this.selectedGame();
    return g ? this.isGameInCart(g.id) : false;
  }

  // PAGINATION
  totalPages = computed(() =>
    Math.ceil(this.filteredGames().length / this.itemsPerPage()) || 1
  );

  paginatedGames = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredGames().slice(start, start + this.itemsPerPage());
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // MODAL
  openGameDetails(game: GameCatalogItem) {
    const fresh = this.allGames().find(g => g.id === game.id);
    this.selectedGame.set(fresh ?? game);
  }

  closeGameDetails() {
    this.selectedGame.set(null);
  }
}