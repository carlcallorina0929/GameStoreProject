import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { ProfileService, ProfileUser } from '../services/profile.service';
import { AuthService } from '../services/auth.service';

const USERNAME_REGEX = /^[A-Za-z0-9_]{6,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,64}$/;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  user = signal<ProfileUser | null>(null);
  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  passwordUpdatedModalOpen = signal(false);

  profileForm!: any;
  passwordForm!: any;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: this.fb.control('', [
        Validators.required,
        Validators.pattern(USERNAME_REGEX),
      ]),
      email: this.fb.control('', [
        Validators.required,
        Validators.pattern(EMAIL_REGEX),
      ]),
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: this.fb.control('', [Validators.required]),
        newPassword: this.fb.control('', [
          Validators.required,
          Validators.pattern(PASSWORD_REGEX),
        ]),
        confirmNewPassword: this.fb.control('', [Validators.required]),
      },
      {
        validators: (group) => {
          const newPassword = group.get('newPassword')?.value ?? '';
          const confirm = group.get('confirmNewPassword')?.value ?? '';
          return newPassword && confirm && newPassword !== confirm
            ? { passwordMismatch: true }
            : null;
        },
      }
    );
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['']);
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.profileService
      .getProfile()
      .pipe(
        catchError((err) => {
          this.errorMessage.set(err?.error?.error ?? 'Failed to load profile');
          if (err?.status === 401 || err?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            this.router.navigate(['']);
          }
          return of(null);
        })
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res?.user) return;

        this.user.set(res.user);
        this.profileForm.patchValue({
          username: res.user.username,
          email: res.user.email,
        });
      });
  }

  saveProfile(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const currentUser = this.user();
    if (!currentUser) return;

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const username = String(this.profileForm.value.username ?? '').trim();
    const email = String(this.profileForm.value.email ?? '').trim();

    const usernameChanged = username !== currentUser.username;
    const emailChanged = email !== currentUser.email;

    if (!usernameChanged && !emailChanged) {
      this.successMessage.set('No changes to save');
      return;
    }

    this.loading.set(true);

    const checks$ = forkJoin({
      usernameOk: usernameChanged
        ? this.authService.checkUsernameAvailability(username).pipe(
            switchMap((r) => of(r.available)),
            catchError(() => of(true))
          )
        : of(true),
      emailOk: emailChanged
        ? this.authService.checkEmailAvailability(email).pipe(
            switchMap((r) => of(r.available)),
            catchError(() => of(true))
          )
        : of(true),
    });

    checks$
      .pipe(
        switchMap(({ usernameOk, emailOk }) => {
          if (!usernameOk) {
            this.loading.set(false);
            this.errorMessage.set('Username already exists');
            return of(null);
          }
          if (!emailOk) {
            this.loading.set(false);
            this.errorMessage.set('Email already exists');
            return of(null);
          }

          return this.profileService.updateProfile({
            ...(usernameChanged ? { username } : {}),
            ...(emailChanged ? { email } : {}),
          });
        }),
        catchError((err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.error ?? 'Failed to update profile');
          return of(null);
        })
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res?.user) return;

        this.user.set(res.user);
        this.profileForm.patchValue({
          username: res.user.username,
          email: res.user.email,
        });
        this.successMessage.set('Profile updated successfully');
      });
  }

  changePassword(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.passwordForm.errors?.['passwordMismatch']) {
      this.errorMessage.set('New passwords do not match');
      return;
    }

    const currentPassword = String(
      this.passwordForm.value.currentPassword ?? ''
    );
    const newPassword = String(this.passwordForm.value.newPassword ?? '');

    this.loading.set(true);
    this.profileService
      .changePassword({ currentPassword, newPassword })
      .pipe(
        catchError((err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.error ?? 'Failed to update password');
          return of(null);
        })
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.passwordForm.reset();
        this.passwordUpdatedModalOpen.set(true);
      });
  }

  confirmPasswordUpdateLogout(): void {
    this.passwordUpdatedModalOpen.set(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.router.navigate(['']);
  }
}
