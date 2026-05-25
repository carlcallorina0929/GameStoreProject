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
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../models/category';
import { GameService } from '../services/game.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GameFilterState, PriceFilter, SortFilter } from '../models/game-filter';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzSelectModule, NzIconModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categories implements OnInit, OnChanges, OnDestroy {

  private gameService = inject(GameService);

  // INPUTS
  @Input() pageSize = 6;
  @Input() activeGenre: string | null = null;

  // OUTPUT
  @Output() genreSelected = new EventEmitter<string | null>();
  @Output() filtersChanged = new EventEmitter<GameFilterState>();

  // STATE
  currentIndex = signal(0);
  allCategories = signal<Category[]>([]);
  loading = signal(true);
  searchText = '';
  selectedPrice: PriceFilter = 'all';
  selectedSort: SortFilter = 'az';
  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // derived page size (IMPORTANT FIX)
  pageSizeSignal = signal(6);

  ngOnInit() {
    this.setPageSize();
    this.loadCategories();
    window.addEventListener('resize', () => this.setPageSize());

    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchText = value;
        this.emitFilters();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeGenre']) {
      this.emitFilters();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchInput$.complete();
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

  skeletonPills = computed(() =>
    Array.from({ length: this.pageSizeSignal() + 1 }, (_, i) => i)
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
    this.filtersChanged.emit({
      search: this.searchText.trim(),
      genre: newValue,
      price: this.selectedPrice,
      sort: this.selectedSort
    });
  }

  isActive(name: string): boolean {
    return this.activeGenre === name;
  }

  onSearchTextChange(value: string) {
    this.searchInput$.next(value ?? '');
  }

  onPriceChange(value: PriceFilter) {
    this.selectedPrice = value || 'all';
    this.emitFilters();
  }

  onSortChange(value: SortFilter) {
    this.selectedSort = value || 'az';
    this.emitFilters();
  }

  private emitFilters() {
    this.filtersChanged.emit({
      search: this.searchText.trim(),
      genre: this.activeGenre,
      price: this.selectedPrice,
      sort: this.selectedSort
    });
  }
}
