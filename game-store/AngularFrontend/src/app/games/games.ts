import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderComponent } from '../loader/loader';
import { Navbar } from '../navbar/navbar';
import { GameService } from '../services/game.service';
import { GameCatalogItem } from '../models/game';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, Navbar, LoaderComponent],
  templateUrl: './games.html',
  styleUrl: './games.css',
})
export class GamesComponent implements OnInit {
  private gameService = inject(GameService);
  private router = inject(Router);

  games = signal<GameCatalogItem[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
 
  ownedCount = computed(() => this.games().filter((g) => g.isOwned).length);

  ngOnInit(): void {
    this.gameService.getGames().subscribe({
      next: (games) => {
        this.games.set(games);
        this.errorMessage.set(null);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load games:', err);
        this.games.set([]);
        this.isLoading.set(false);

        // If the token is missing/expired, the backend will typically return 401.
        // Keep it simple: show a message and send the user back to login if they want.
        this.errorMessage.set('Could not load games. Please login again and try.');
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['']);
  }
}

