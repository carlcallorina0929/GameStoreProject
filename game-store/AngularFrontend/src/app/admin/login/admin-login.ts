import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AdminAuthService);
  private notification = inject(NzNotificationService);

  loading = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/admin/dashboard');
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.form.getRawValue() as { username: string; password: string };

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.authService.storeToken(response.token);
        this.loading.set(false);
        this.router.navigateByUrl('/admin/dashboard');
      },
      error: (error) => {
        this.loading.set(false);
        const message = error?.error?.error ?? 'Invalid Username or Password';
        this.notification.error('Login Failed', message, { nzPlacement: 'bottomRight' });
      },
    });
  }
}
