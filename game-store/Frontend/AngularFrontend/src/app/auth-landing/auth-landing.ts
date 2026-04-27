import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

type AvailabilityState =
  | 'unknown'
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  templateUrl: './auth-landing.html',
  styleUrl: './auth-landing.css',
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class AuthLandingComponent {

  authMode: 'login' | 'register' = 'login';

constructor(
  private authService: AuthService,
  private router: Router,
  private cd: ChangeDetectorRef
) {}

  // =========================
  // STATE
  // =========================

  login = {
    username: '',
    password: ''
  };

  register = {
    username: '',
    first_name: '',
    last_name: '',
    age: '',
    email: '',
    password: ''
  };

  loginTouched = {
    username: false,
    password: false
  };

  registerTouched = {
    username: false,
    first_name: false,
    last_name: false,
    age: false,
    email: false,
    password: false
  };

  loginSubmitted = false;
  registerSubmitted = false;

  isLoginSubmitting = false;
  isRegisterSubmitting = false;

  showRegistrationSuccessModal = false;

  usernameAvailability: AvailabilityState = 'unknown';
  emailAvailability: AvailabilityState = 'unknown';

  private usernameTimer: any;
  private emailTimer: any;

  // =========================
  // MODE
  // =========================

  setAuthMode(mode: 'login' | 'register') {
    this.authMode = mode;
  }

  // =========================
  // INPUT HANDLERS
  // =========================

  onLoginInput(field: keyof typeof this.login, value: string) {
    this.login[field] = value;
  }

  onRegisterInput(field: keyof typeof this.register, value: string) {
    let val = value;

    if (field === 'first_name' || field === 'last_name') {
      val = value.replace(/[^A-Za-z]/g, '');
    }

    this.register[field] = val;

    if (field === 'username') {
      this.usernameAvailability = 'unknown';

      clearTimeout(this.usernameTimer);
      this.usernameTimer = setTimeout(() => {
        this.checkUsernameAvailability();
      }, 500);
    }

    if (field === 'email') {
      this.emailAvailability = 'unknown';

      clearTimeout(this.emailTimer);
      this.emailTimer = setTimeout(() => {
        this.checkEmailAvailability();
      }, 500);
    }
  }

  markLoginTouched(field: keyof typeof this.loginTouched) {
    this.loginTouched[field] = true;
  }

  markRegisterTouched(field: keyof typeof this.registerTouched) {
    this.registerTouched[field] = true;
  }

  // =========================
  // VALIDATION
  // =========================

  private usernameError(v: string) {
    const t = v.trim();
    if (!t) return 'Username is required.';
    if (!/^[A-Za-z0-9_]{6,30}$/.test(t)) return 'Invalid username.';
    return null;
  }

  private emailError(v: string) {
    const t = v.trim();
    if (!t) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Invalid email.';
    return null;
  }

  private passwordError(v: string) {
    if (!v) return 'Password is required.';
    if (!/^(?=.*[A-Z])(?=.*\d).{8,64}$/.test(v)) {
      return 'Min 8 chars, 1 uppercase, 1 number.';
    }
    return null;
  }

  // =========================
  // ERROR HELPERS
  // =========================

  shouldShowLoginError(field: keyof typeof this.login): boolean {
    return this.loginSubmitted || this.loginTouched[field];
  }

  shouldShowRegisterError(field: keyof typeof this.register): boolean {
    return this.registerSubmitted || this.registerTouched[field];
  }

  getLoginFieldError(field: keyof typeof this.login): string | null {
    if (field === 'username') return this.usernameError(this.login.username);
    if (field === 'password') return this.passwordError(this.login.password);
    return null;
  }

  getRegisterFieldError(field: keyof typeof this.register) {
    switch (field) {
      case 'username':
        return this.usernameError(this.register.username);
      case 'email':
        return this.emailError(this.register.email);
      case 'password':
        return this.passwordError(this.register.password);
      default:
        return null;
    }
  }

  // =========================
  // FIXED REGISTER VALIDATION
  // =========================

  get isRegisterFormValid(): boolean {

    const usernameValid =
      !this.getRegisterFieldError('username') &&
      this.usernameAvailability === 'available';

    const emailValid =
      !this.getRegisterFieldError('email') &&
      this.emailAvailability === 'available';

    const passwordValid =
      !this.getRegisterFieldError('password');

    const requiredFieldsFilled =
      this.register.username.trim().length > 0 &&
      this.register.first_name.trim().length > 0 &&
      this.register.last_name.trim().length > 0 &&
      this.register.age !== '' &&
      this.register.email.trim().length > 0 &&
      this.register.password.length > 0;

    return (
      usernameValid &&
      emailValid &&
      passwordValid &&
      requiredFieldsFilled
    );
  }

  // =========================
  // AVAILABILITY CHECKERS
  // =========================

  checkUsernameAvailability() {
    const username = this.register.username.trim();
    if (!username) return;

    this.usernameAvailability = 'checking';

    this.authService.checkUsernameAvailability(username).subscribe({
      next: (res) => {
        this.usernameAvailability = res.available ? 'available' : 'taken';
      },
      error: () => {
        this.usernameAvailability = 'error';
      }
    });
  }

  checkEmailAvailability() {
    const email = this.register.email.trim();
    if (!email) return;

    this.emailAvailability = 'checking';

    this.authService.checkEmailAvailability(email).subscribe({
      next: (res) => {
        this.emailAvailability = res.available ? 'available' : 'taken';
      },
      error: () => {
        this.emailAvailability = 'error';
      }
    });
  }

  // =========================
  // LOGIN
  // =========================

  handleLogin(event: Event) {
    event.preventDefault();

    this.loginSubmitted = true;

    if (
      this.usernameError(this.login.username) ||
      this.passwordError(this.login.password)
    ) return;

    if (this.isLoginSubmitting) return;

    this.isLoginSubmitting = true;

    this.authService.login({
      username: this.login.username.trim(),
      password: this.login.password
    }).subscribe({
      next: (res) => {
        if (res?.token) {
          localStorage.setItem('token', res.token);
        }

        this.isLoginSubmitting = false;
        this.router.navigateByUrl('/home');
      },
      error: () => {
        this.isLoginSubmitting = false;
      }
    });
  }

  // =========================
  // REGISTER
  // =========================

 handleRegister(event: Event) {
  event.preventDefault();

  this.registerSubmitted = true;

  for (const k of Object.keys(this.registerTouched) as Array<keyof typeof this.registerTouched>) {
    this.registerTouched[k] = true;
  }

  const usernameErr = this.usernameError(this.register.username);
  const emailErr = this.emailError(this.register.email);
  const passwordErr = this.passwordError(this.register.password);

  if (usernameErr || emailErr || passwordErr) return;

  if (this.usernameAvailability !== 'available') return;
  if (this.emailAvailability !== 'available') return;

  if (this.isRegisterSubmitting) return;

  this.isRegisterSubmitting = true;

  const payload = {
    username: this.register.username.trim(),
    first_name: this.register.first_name.trim(),
    last_name: this.register.last_name.trim(),
    age: this.register.age ? Number(this.register.age) : 0,
    email: this.register.email.trim(),
    password: this.register.password
  };

  this.authService.register(payload).subscribe({
    next: (res) => {
      this.isRegisterSubmitting = false;

      // 🔥 FORCE UI UPDATE IMMEDIATELY
      this.showRegistrationSuccessModal = true;
this.cd.detectChanges();
    },

    error: (err) => {
      console.log('REGISTER ERROR:', err);
      this.isRegisterSubmitting = false;
      this.showRegistrationSuccessModal = false;
    }
  });
}
  // =========================
  // MODAL
  // =========================

  goToLoginFromSuccessModal() {
    this.showRegistrationSuccessModal = false;

    this.register = {
      username: '',
      first_name: '',
      last_name: '',
      age: '',
      email: '',
      password: ''
    };

    this.usernameAvailability = 'unknown';
    this.emailAvailability = 'unknown';

    this.authMode = 'login';
  }
}