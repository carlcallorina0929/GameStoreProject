import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AdminGameRecord, AdminGamesService, GameGenre } from '../services/admin-games.service';

@Component({
  selector: 'app-admin-games',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzTagModule,
    NzUploadModule,
    NzSelectModule,
  ],
  templateUrl: './admin-games.html',
  styleUrl: './admin-games.css',
})
export class AdminGamesComponent implements OnInit {
  private service = inject(AdminGamesService);
  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);

  games = signal<AdminGameRecord[]>([]);
  loading = signal(false);
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  includeInactive = signal(true);
  search = signal('');

  modalVisible = signal(false);
  createdModalVisible = signal(false);
  createdGameTitle = signal('');
  successModalMode = signal<'create' | 'edit'>('create');
  modalMode = signal<'create' | 'edit'>('create');
  editingGameId = signal<number | null>(null);
  submitting = signal(false);

  fileList = signal<NzUploadFile[]>([]);
  selectedImage = signal<File | null>(null);
  availableGenres = signal<GameGenre[]>([]);

  form = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    discount_percent: [0, [Validators.min(0), Validators.max(100)]],
    discount_start: [''],
    discount_end: [''],
    isActive: [true],
    genre_ids: [[] as number[]],
  });

  ngOnInit(): void {
    this.fetchGames();
    this.fetchGenres();
  }

  fetchGenres(): void {
    this.service.getGenres().subscribe({
      next: (genres) => this.availableGenres.set(genres),
      error: () => {
        this.notification.error('Genres', 'Failed to load genres', { nzPlacement: 'bottomRight' });
      },
    });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const nativeFile = (file as unknown as { originFileObj?: File }).originFileObj;
    this.selectedImage.set(nativeFile ?? (file as unknown as File));
    this.fileList.set([file]);
    return false;
  };

  removeUpload = (): boolean => {
    this.fileList.set([]);
    this.selectedImage.set(null);
    return true;
  };

  fetchGames(): void {
    this.loading.set(true);
    this.service
      .getGames({
        page: this.page(),
        limit: this.limit(),
        includeInactive: this.includeInactive(),
        search: this.search(),
      })
      .subscribe({
        next: (response) => {
          this.games.set(response.data);
          this.total.set(response.pagination.total);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          const message = error?.error?.error ?? 'Failed to fetch games';
          this.notification.error('Games', message, { nzPlacement: 'bottomRight' });
        },
      });
  }

  onSearch(value: string): void {
    this.search.set(value.trim());
    this.page.set(1);
    this.fetchGames();
  }

  onPageIndexChange(page: number): void {
    this.page.set(page);
    this.fetchGames();
  }

  toggleInactive(value: boolean): void {
    this.includeInactive.set(value);
    this.page.set(1);
    this.fetchGames();
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingGameId.set(null);
    this.form.reset({
      title: '',
      description: '',
      price: 0,
      discount_percent: 0,
      discount_start: '',
      discount_end: '',
      isActive: true,
      genre_ids: [],
    });
    this.fileList.set([]);
    this.selectedImage.set(null);
    this.modalVisible.set(true);
  }

  openEditModal(game: AdminGameRecord): void {
    this.modalMode.set('edit');
    this.editingGameId.set(game.id);
    this.form.reset({
      title: game.title,
      description: game.description,
      price: game.price,
      discount_percent: game.discount_percent ?? 0,
      discount_start: this.toDateTimeLocal(game.discount_start),
      discount_end: this.toDateTimeLocal(game.discount_end),
      isActive: !!game.isActive,
      genre_ids: this.parseGenreIds(game.genre_ids),
    });
    this.fileList.set([]);
    this.selectedImage.set(null);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
    this.submitting.set(false);
  }

  closeCreatedModal(): void {
    this.createdModalVisible.set(false);
    this.createdGameTitle.set('');
    this.successModalMode.set('create');
  }

  createAnotherGame(): void {
    this.closeCreatedModal();
    this.openCreateModal();
  }

  submitModal(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.modalMode() === 'create' && !this.selectedImage()) {
      this.notification.error('Games', 'Game image is required', { nzPlacement: 'bottomRight' });
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const payload = new FormData();
    payload.append('title', String(raw.title ?? ''));
    payload.append('description', String(raw.description ?? ''));
    payload.append('price', String(raw.price ?? 0));
    payload.append('discount_percent', String(raw.discount_percent ?? 0));
    payload.append('discount_start', raw.discount_start ? String(raw.discount_start) : '');
    payload.append('discount_end', raw.discount_end ? String(raw.discount_end) : '');
    payload.append('isActive', String(!!raw.isActive));
    payload.append('genre_ids', JSON.stringify(raw.genre_ids ?? []));

    if (this.selectedImage()) {
      payload.append('image', this.selectedImage() as File);
    }

    if (this.modalMode() === 'create') {
      this.service.createGame(payload).subscribe({
        next: () => {
          const createdTitle = String(raw.title ?? '');
          this.createdGameTitle.set(createdTitle);
          this.successModalMode.set('create');
          this.createdModalVisible.set(true);
          this.notification.success(
            'Game Added',
            `"${createdTitle}" was added successfully.`,
            { nzPlacement: 'bottomRight', nzDuration: 2600, nzClass: 'toast' },
          );
          this.closeModal();
          this.fetchGames();
        },
        error: (error) => {
          this.submitting.set(false);
          const message = error?.error?.error ?? 'Failed to create game';
          this.notification.error('Games', message, { nzPlacement: 'bottomRight' });
        },
      });
      return;
    }

    const gameId = this.editingGameId();
    if (!gameId) {
      this.submitting.set(false);
      return;
    }

    this.service.updateGame(gameId, payload).subscribe({
      next: () => {
        this.createdGameTitle.set(String(raw.title ?? ''));
        this.successModalMode.set('edit');
        this.createdModalVisible.set(true);
        this.notification.success('Games', 'Game updated successfully', { nzPlacement: 'bottomRight' });
        this.closeModal();
        this.fetchGames();
      },
      error: (error) => {
        this.submitting.set(false);
        const message = error?.error?.error ?? 'Failed to update game';
        this.notification.error('Games', message, { nzPlacement: 'bottomRight' });
      },
    });
  }

  softDeleteGame(game: AdminGameRecord): void {
    this.service.softDeleteGame(game.id).subscribe({
      next: () => {
        this.notification.success('Games', 'Game soft deleted', { nzPlacement: 'bottomRight' });
        this.fetchGames();
      },
      error: (error) => {
        const message = error?.error?.error ?? 'Failed to soft delete game';
        this.notification.error('Games', message, { nzPlacement: 'bottomRight' });
      },
    });
  }

  private toDateTimeLocal(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  private parseGenreIds(value?: string | null): number[] {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v));
  }
}
