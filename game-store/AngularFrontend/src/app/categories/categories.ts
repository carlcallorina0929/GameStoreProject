import { Component, signal, computed, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interface for Category data structure
 */
export interface GameCategory {
  id: number | string;
  name: string;
  slug?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./categories.html' ,
  styleUrl:'./categories.css' ,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categories {
  @Input() pageSize = 5;
  currentIndex = signal(0);
  
  allCategories = signal<GameCategory[]>([
    { id: 'act', name: 'Action' },
    { id: 'rpg', name: 'RPG' },
    { id: 'str', name: 'Strategy' },
    { id: 'spo', name: 'Sports' },
    { id: 'hor', name: 'Horror' },
    { id: 'rac', name: 'Racing' },
    { id: 'adv', name: 'Adventure' },
    { id: 'sim', name: 'Simulation' },
    { id: 'ind', name: 'Indie' },
    { id: 'sci', name: 'Sci-Fi' },
    { id: 'fps', name: 'FPS' },
    { id: 'puz', name: 'Puzzle' }
  ]);

  visibleCategories = computed(() => {
    const start = this.currentIndex();
    return this.allCategories().slice(start, start + this.pageSize);
  });

  next() {
    const nextIndex = this.currentIndex() + this.pageSize;
    if (nextIndex < this.allCategories().length) {
      this.currentIndex.set(nextIndex);
    }
  }

  prev() {
    const prevIndex = this.currentIndex() - this.pageSize;
    if (prevIndex >= 0) {
      this.currentIndex.set(prevIndex);
    }
  }
}