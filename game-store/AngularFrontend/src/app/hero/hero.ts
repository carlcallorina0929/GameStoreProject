import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { GameService } from '../services/game.service';
import { Game } from '../models/game';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);

  // ----- Reactive state -----
  games = signal<Game[]>([]);
  isLoading = signal(true);

  // Slider state
  currentIndex = signal(0);
  isPaused = signal(false);

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

  next(): void {
    const list = this.games();
    if (list.length === 0) return;

    this.currentIndex.update((i) => (i + 1) % list.length);
  }

  prev(): void {
    const list = this.games();
    if (list.length === 0) return;

    this.currentIndex.update((i) => (i - 1 + list.length) % list.length);
  }

  goTo(index: number): void {
    const list = this.games();
    if (list.length === 0) return;

    const safeIndex = Math.min(Math.max(index, 0), list.length - 1);
    this.currentIndex.set(safeIndex);

    // Nice UX: reset the timer after manual navigation.
    this.startAutoSlide();
  }

  // ----- Auto-slide (every 5 seconds) -----

  startAutoSlide(): void {
    const list = this.games();
    if (this.isLoading() || this.isPaused() || list.length <= 1) return;

    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => this.next(), 5000);
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
}
