import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../models/category';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categories implements OnInit, OnChanges {

  private gameService = inject(GameService);

  // INPUTS
  @Input() pageSize = 6;
  @Input() activeGenre: string | null = null;

  // OUTPUT
  @Output() genreSelected = new EventEmitter<string | null>();

  // STATE
  currentIndex = signal(0);
  allCategories = signal<Category[]>([]);
  loading = signal(true);

  // derived page size (IMPORTANT FIX)
  pageSizeSignal = signal(6);

  ngOnInit() {
    this.setPageSize();
    this.loadCategories();
    window.addEventListener('resize', () => this.setPageSize());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeGenre']) {
      // ensures UI updates immediately when parent changes it
    }
  }

  loadCategories() {
    this.loading.set(true);

    this.gameService.getCategories().subscribe({
      next: (data) => {
        this.allCategories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.loading.set(false);
      }
    });
  }

  setPageSize() {
    const width = window.innerWidth;

    let size = 6;

    if (width <= 600) {
      size = 5;
    } else if (width <= 900) {
      size = 8;
    } else {
      size = 9;
    }

    this.pageSizeSignal.set(size);
  }

  visibleCategories = computed(() =>
    this.allCategories().slice(
      this.currentIndex(),
      this.currentIndex() + this.pageSizeSignal()
    )
  );

  next() {
    const nextIndex = this.currentIndex() + this.pageSizeSignal();
    if (nextIndex < this.allCategories().length) {
      this.currentIndex.set(nextIndex);
    }
  }

  prev() {
    const prevIndex = this.currentIndex() - this.pageSizeSignal();
    if (prevIndex >= 0) {
      this.currentIndex.set(prevIndex);
    }
  }

  // ✅ FIXED SELECTION LOGIC
  selectCategory(name: string | null) {
    const newValue = this.activeGenre === name ? null : name;
    this.genreSelected.emit(newValue);
  }

  isActive(name: string): boolean {
    return this.activeGenre === name;
  }
}