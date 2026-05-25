import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { GameService } from '../services/game.service';
import { Game } from '../models/game';
import { CartService } from '../services/cart.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);
  private cartService = inject(CartService);
  private notification = inject(NzNotificationService);
  private touchStartX = 0;
private touchEndX = 0;

  // ----- Reactive state -----
  games = signal<Game[]>([]);
  isLoading = signal(true);
  imageLoaded = signal(false);
readyGame = signal<Game | null>(null);
  // Slider state
  currentIndex = signal(0);
  isPaused = signal(false);

  onTouchStart(event: TouchEvent): void {
  this.touchStartX = event.changedTouches[0].screenX;
}
onTouchEnd(event: TouchEvent): void {
  this.touchEndX = event.changedTouches[0].screenX;
  this.handleSwipe();
}
private handleSwipe(): void {
  const swipeDistance = this.touchStartX - this.touchEndX;
  const threshold = 50;

  if (Math.abs(swipeDistance) < threshold) return;

  if (swipeDistance > 0) {
    this.mobileNext();
  } else {
    this.mobilePrev();
  }
}

  private preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.src = url;

    img.onload = () => resolve();
    img.onerror = () => reject();
  });
}
private fastSlide(index: number) {
  const game = this.games()[index];
  if (!game) return;

  this.currentIndex.set(index);
  this.readyGame.set(game);
}

  // Derived: safely get the current game (or null if none)
  currentGame = computed(() => {
    const list = this.games();
    if (list.length === 0) return null;

    const index = this.currentIndex();
    return list[Math.min(Math.max(index, 0), list.length - 1)] ?? null;
  });

  private autoSlideTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // 1) Fetch discounted games from the backend API.
    // The JWT token is added automatically by the authInterceptor.
    this.gameService.getDiscountedGames().subscribe({
      next: (games) => {
        this.games.set(games);
        this.currentIndex.set(0);
        this.isLoading.set(false);

        // 2) Only start auto-slide after data is loaded, and only if there is more than 1 game.
        this.startAutoSlide();
      },
      error: (err) => {
        console.error('Failed to load discounted games:', err);

        // Fallback: empty list so the UI doesn't crash.
        this.games.set([]);
        this.currentIndex.set(0);
        this.isLoading.set(false);

        this.stopAutoSlide();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  // ----- Slider controls -----
  private async mobileLoadSlide(index: number): Promise<void> {
  const game = this.games()[index];
  if (!game) return;

  this.isLoading.set(true);

  const start = performance.now();

  try {
    if (game.imageUrl) {
      await this.preloadImage(game.imageUrl);
    }

    this.currentIndex.set(index);
    this.readyGame.set(game);

  } catch {
    this.currentIndex.set(index);
    this.readyGame.set(game);
  } finally {
    const elapsed = performance.now() - start;
    const minDelay = 400; // ms

    const remaining = Math.max(0, minDelay - elapsed);

    setTimeout(() => {
      this.isLoading.set(false);
    }, remaining);
  }
}
 async mobileNext(): Promise<void> {
  const list = this.games();
  if (list.length === 0) return;

  const nextIndex = (this.currentIndex() + 1) % list.length;
  await this.mobileLoadSlide(nextIndex);
}
async mobilePrev(): Promise<void> {
  const list = this.games();
  if (list.length === 0) return;

  const prevIndex =
    (this.currentIndex() - 1 + list.length) % list.length;

  await this.mobileLoadSlide(prevIndex);
}

 next(): void {
  const list = this.games();
  if (list.length === 0) return;

  const newIndex = (this.currentIndex() + 1) % list.length;

  this.fastSlide(newIndex);
}

 prev(): void {
  const list = this.games();
  if (list.length === 0) return;

  const newIndex = (this.currentIndex() - 1 + list.length) % list.length;

  this.fastSlide(newIndex);
}

  goTo(index: number): void {
  const list = this.games();
  if (list.length === 0) return;

  const safeIndex = Math.min(Math.max(index, 0), list.length - 1);

  this.loadSlide(safeIndex);
  this.stopAutoSlide();
  this.startAutoSlide();
}
private async loadSlide(index: number) {
  const game = this.games()[index];
  if (!game) return;

  this.isLoading.set(true);
  const start = performance.now();

  try {
    // If no image, skip preload
    if (game.imageUrl) {
      await this.preloadImage(game.imageUrl);
    }

    // Only now update UI state
    this.currentIndex.set(index);
    this.readyGame.set(game);
  } catch (err) {
    // fallback even if image fails
    this.currentIndex.set(index);
    this.readyGame.set(game);
  } finally {
    const elapsed = performance.now() - start;
    const minDelay = 400; // ms

    const remaining = Math.max(0, minDelay - elapsed);

    setTimeout(() => {
      this.isLoading.set(false);
    }, remaining);
  }
}
  // ----- Auto-slide (every 5 seconds) -----

 startAutoSlide(): void {
  const list = this.games();

  if (this.isPaused() || list.length <= 1) return;

  this.stopAutoSlide(); // always reset first

  this.autoSlideTimer = setInterval(() => {
    if (!this.isPaused()) {
      this.next();
    }
  }, 5000);
}

  stopAutoSlide(): void {
    if (!this.autoSlideTimer) return;
    clearInterval(this.autoSlideTimer);
    this.autoSlideTimer = null;
  }

  pause(): void {
    this.isPaused.set(true);
    this.stopAutoSlide();
  }

  resume(): void {
    this.isPaused.set(false);
    this.startAutoSlide();
  }

  // Helper for templates: disables controls if we don't have enough slides
  get canSlide(): boolean {
    return this.games().length > 1 && !this.isLoading();
  }

  addCurrentGameToCart(): void {
    const game = this.currentGame();
    if (!game || game.isOwned || game.isInCart) {
      return;
    }

    this.cartService.addToCart(game.id).subscribe({
      next: () => {
        this.games.update((games) =>
          games.map((item) =>
            item.id === game.id ? { ...item, isInCart: true } : item
          )
        );

        this.notification.success(
          'Added to Cart',
          `${game.title} added successfully.`,
          {
            nzPlacement: 'bottomRight',
            nzDuration: 2500,
            nzClass: 'toast',
          }
        );
      },
      error: () => {
        this.notification.error(
          'Cart Error',
          'Failed to add game to cart.',
          {
            nzPlacement: 'bottomRight',
          }
        );
      },
    });
  }
}
