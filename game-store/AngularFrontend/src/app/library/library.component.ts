import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LibraryService } from '../services/library.service';
import { LibraryGameItem } from '../models/library-item';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryComponent implements OnInit {
  private libraryService = inject(LibraryService);

  libraryGames = signal<LibraryGameItem[]>([]);
  loading = signal(true);
  skeletonArray = Array(8);
  currentPage = signal(1);
  itemsPerPage = signal(8);

  totalPages = computed(() => Math.ceil(this.libraryGames().length / this.itemsPerPage()) || 1);

  paginatedGames = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.libraryGames().slice(start, start + this.itemsPerPage());
  });

  ngOnInit() {
    this.loadLibrary();
  }

  loadLibrary() {
    this.loading.set(true);
    this.libraryService.getLibrary().subscribe({
      next: (games) => {
        this.libraryGames.set(games);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load library', error);
        this.libraryGames.set([]);
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  trackByGame(_: number, item: LibraryGameItem) {
    return item.id;
  }
}
