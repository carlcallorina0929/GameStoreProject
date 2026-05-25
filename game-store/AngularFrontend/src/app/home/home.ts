import { Component , OnInit , signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero';
import { Categories } from '../categories/categories';
import { GamesComponent } from '../games/games';
import { GameFilterState } from '../models/game-filter';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, Categories, GamesComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  isPageLoading = signal(true);

  filterState = signal<GameFilterState>({
    search: '',
    genre: null,
    price: 'all',
    sort: 'az'
  });

  onFiltersChanged(filters: GameFilterState) {
    this.filterState.set(filters);
  }

  ngOnInit() {
    setTimeout(() => {
      console.log('Home timer finished');
      this.isPageLoading.set(false);
    }, 1000);
  }

  onLoaderComplete(): void {
    this.isPageLoading.set(false);
  }
}

