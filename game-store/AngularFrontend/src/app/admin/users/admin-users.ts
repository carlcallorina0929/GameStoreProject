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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AdminUserRecord, AdminUsersService } from '../services/admin-users.service';

@Component({
  selector: 'app-admin-users',
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
    NzSelectModule,
    NzSwitchModule,
    NzTagModule,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {
  private service = inject(AdminUsersService);
  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);

  users = signal<AdminUserRecord[]>([]);
  loading = signal(false);
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  includeInactive = signal(true);
  search = signal('');

  modalVisible = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingUserId = signal<number | null>(null);
  submitting = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required]],
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    age: [18, [Validators.required, Validators.min(1), Validators.max(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['user' as 'user' | 'admin', [Validators.required]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading.set(true);
    this.service
      .getUsers({
        page: this.page(),
        limit: this.limit(),
        includeInactive: this.includeInactive(),
        search: this.search(),
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.total.set(response.pagination.total);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          const message = error?.error?.error ?? 'Failed to fetch users';
          this.notification.error('Users', message, { nzPlacement: 'bottomRight' });
        },
      });
  }

  onSearch(value: string): void {
    this.search.set(value.trim());
    this.page.set(1);
    this.fetchUsers();
  }

  onPageIndexChange(page: number): void {
    this.page.set(page);
    this.fetchUsers();
  }

  toggleInactive(value: boolean): void {
    this.includeInactive.set(value);
    this.page.set(1);
    this.fetchUsers();
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingUserId.set(null);
    this.form.reset({
      username: '',
      first_name: '',
      last_name: '',
      age: 18,
      email: '',
      password: '',
      role: 'user',
      isActive: true,
    });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalVisible.set(true);
  }

  openEditModal(user: AdminUserRecord): void {
    this.modalMode.set('edit');
    this.editingUserId.set(user.id);
    this.form.reset({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      age: user.age,
      email: user.email,
      password: '',
      role: user.role,
      isActive: !!user.isActive,
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
    this.submitting.set(false);
  }

  submitModal(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.submitting.set(true);

    if (this.modalMode() === 'create') {
      const payload = {
        username: raw.username ?? '',
        first_name: raw.first_name ?? '',
        last_name: raw.last_name ?? '',
        age: Number(raw.age ?? 0),
        email: raw.email ?? '',
        password: raw.password ?? '',
        role: (raw.role ?? 'user') as 'user' | 'admin',
      };

      this.service.createUser(payload).subscribe({
        next: () => {
          this.notification.success('Users', 'User created successfully', { nzPlacement: 'bottomRight' });
          this.closeModal();
          this.fetchUsers();
        },
        error: (error) => {
          this.submitting.set(false);
          const message = error?.error?.error ?? 'Failed to create user';
          this.notification.error('Users', message, { nzPlacement: 'bottomRight' });
        },
      });
      return;
    }

    const userId = this.editingUserId();
    if (!userId) {
      this.submitting.set(false);
      return;
    }

    const payload: Record<string, unknown> = {
      username: raw.username ?? '',
      first_name: raw.first_name ?? '',
      last_name: raw.last_name ?? '',
      age: Number(raw.age ?? 0),
      email: raw.email ?? '',
      role: (raw.role ?? 'user') as 'user' | 'admin',
      isActive: !!raw.isActive,
    };

    if (raw.password) {
      payload['password'] = raw.password;
    }

    this.service.updateUser(userId, payload).subscribe({
      next: () => {
        this.notification.success('Users', 'User updated successfully', { nzPlacement: 'bottomRight' });
        this.closeModal();
        this.fetchUsers();
      },
      error: (error) => {
        this.submitting.set(false);
        const message = error?.error?.error ?? 'Failed to update user';
        this.notification.error('Users', message, { nzPlacement: 'bottomRight' });
      },
    });
  }

  softDeleteUser(user: AdminUserRecord): void {
    this.service.softDeleteUser(user.id).subscribe({
      next: () => {
        this.notification.success('Users', 'User soft deleted', { nzPlacement: 'bottomRight' });
        this.fetchUsers();
      },
      error: (error) => {
        const message = error?.error?.error ?? 'Failed to soft delete user';
        this.notification.error('Users', message, { nzPlacement: 'bottomRight' });
      },
    });
  }
}
