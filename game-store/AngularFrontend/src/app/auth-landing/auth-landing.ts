import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

type AvailabilityState = 'unknown' | 'checking' | 'available' | 'taken' | 'error';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  templateUrl: './auth-landing.html',
  styleUrl: './auth-landing.css',
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class AuthLandingComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  // Keep frontend validation aligned with backend `BackendConfig/utils/validationPatterns.js`
  private readonly usernameRegex = /^[A-Za-z0-9_]{6,20}$/;

  // --- SIGNALS FOR REACTIVE STATE ---
  authMode = signal<'login' | 'register'>('login');
  
  loginData = signal({ username: '', password: '' });
  registerData = signal({
    username: '',
    first_name: '',
    last_name: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  loginErrorMessage = signal<string | null>(null);
  registerErrorMessage = signal<string | null>(null);
  loginTouched = signal({ username: false, password: false });
  loginFocused = signal({ username: false, password: false });
  registerTouched = signal({
    username: false,
    first_name: false,
    last_name: false,
    age: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  registerFocused = signal({
    username: false,
    first_name: false,
    last_name: false,
    age: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  loginSubmitted = signal(false);
  registerSubmitted = signal(false);
  
  isLoginSubmitting = signal(false);
  isRegisterSubmitting = signal(false);
  showRegistrationSuccessModal = signal(false);

  usernameAvailability = signal<AvailabilityState>('unknown');
  emailAvailability = signal<AvailabilityState>('unknown');

  private usernameTimer: any;
  private emailTimer: any;

  // --- ACTIONS ---

  setAuthMode(mode: 'login' | 'register') {
  this.authMode.set(mode);

  // RESET LOGIN STATE
  if (mode === 'login') {
    this.loginData.set({ username: '', password: '' });
    this.loginTouched.set({ username: false, password: false });
    this.loginSubmitted.set(false);
    this.loginErrorMessage.set(null);
  }

  // RESET REGISTER STATE
  if (mode === 'register') {
    this.registerData.set({
      username: '',
      first_name: '',
      last_name: '',
      age: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    this.registerTouched.set({
      username: false,
      first_name: false,
      last_name: false,
      age: false,
      email: false,
      password: false,
      confirmPassword: false
    });

    this.registerSubmitted.set(false);
    this.registerErrorMessage.set(null);

    this.usernameAvailability.set('unknown');
    this.emailAvailability.set('unknown');
  }
}

  onLoginInput(field: 'username' | 'password', value: string) {
    this.loginData.update(prev => ({ ...prev, [field]: value }));
  }

  onRegisterInput(field: keyof ReturnType<typeof this.registerData>, value: string) {
    let val = value;
    
    if (field === 'password') {
  const passwordValid = this.passwordError(value) === null;

  if (!passwordValid) {
    this.registerData.update(prev => ({
      ...prev,
      confirmPassword: ''
    }));

    this.registerTouched.update(prev => ({
      ...prev,
      confirmPassword: false
    }));
  }
}
    // Auto-strip non-letters for name fields
    if (field === 'first_name' || field === 'last_name') {
      
    }

    this.registerData.update(prev => ({ ...prev, [field]: val }));

    if (field === 'username') {
      this.usernameAvailability.set('unknown');
      clearTimeout(this.usernameTimer);
      this.usernameTimer = setTimeout(() => this.checkUsernameAvailability(), 500);
    }

    if (field === 'email') {
      this.emailAvailability.set('unknown');
      clearTimeout(this.emailTimer);
      this.emailTimer = setTimeout(() => this.checkEmailAvailability(), 500);
    }
  }

  markLoginTouched(field: 'username' | 'password') {
    this.loginTouched.update(prev => ({ ...prev, [field]: true }));
  }

  markRegisterTouched(field: keyof ReturnType<typeof this.registerTouched>) {
    this.registerTouched.update(prev => ({ ...prev, [field]: true }));
  }

  setLoginFocused(field: 'username' | 'password', focused: boolean) {
    this.loginFocused.update(prev => ({ ...prev, [field]: focused }));
  }

  setRegisterFocused(field: keyof ReturnType<typeof this.registerFocused>, focused: boolean) {
    this.registerFocused.update(prev => ({ ...prev, [field]: focused }));
  }

  // --- VALIDATION LOGIC ---

  // Login should only validate presence (backend will validate credentials).
  loginUsernameError(v: string) {
    const t = v.trim();
    if (!t) return 'Username is required.';
    return null;
  }

  loginPasswordError(v: string) {
    if (!v) return 'Password is required.';
    return null;
  }

  usernameError(v: string) {
    const t = v.trim();
    if (!t) return 'Username is required.';
    if (!this.usernameRegex.test(t)) {
      return 'Username must be 6-20 characters and contain only letters, numbers, and underscores.';
    }
    return null;
  }

  nameError(v: string, fieldName: string) {
    const trimmed = v.trim();
    if (!trimmed) return `${fieldName} is required.`;
    if (!/^[A-Za-z]+$/.test(trimmed)) return `${fieldName} must contain letters only.`;
    return null;
  }

 ageError(v: string) {
  const num = Number(v);

  if (!v || v.trim().length === 0) return 'Age is required.';
  if (isNaN(num)) return 'Age must be a number.';
   if (num < 1 || num > 120) return 'Age must be between 1 and 120.';
  return null;
}

  emailError(v: string) {
    const t = v.trim();
    if (!t) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Invalid email address.';
    return null;
  }

  passwordError(v: string) {
    if (!v) return 'Password is required.';
    if (!/^(?=.*[A-Z])(?=.*\d).{8,64}$/.test(v)) {
      return 'Min 8 chars, 1 uppercase, 1 number.';
    }
    return null;
  }

  confirmPasswordError(password: string, confirmPassword: string) {
    if (!confirmPassword) return 'This field is required.';
    if (password !== confirmPassword) return 'Password do not match.';
    return null;
  }

  // --- AVAILABILITY ---

  checkUsernameAvailability() {
    const username = this.registerData().username.trim();
    if (!username || this.usernameError(username)) return;
    this.usernameAvailability.set('checking');
    this.authService.checkUsernameAvailability(username).subscribe({
      next: (res) => this.usernameAvailability.set(res.available ? 'available' : 'taken'),
      error: () => this.usernameAvailability.set('error')
    });
  }

  checkEmailAvailability() {
    const email = this.registerData().email.trim();
    if (!email || this.emailError(email)) return;
    this.emailAvailability.set('checking');
    this.authService.checkEmailAvailability(email).subscribe({
      next: (res) => this.emailAvailability.set(res.available ? 'available' : 'taken'),
      error: () => this.emailAvailability.set('error')
    });
  }

  // --- SUBMISSION ---

  handleLogin(event: Event) {
    event.preventDefault();
    this.loginSubmitted.set(true);
    const data = this.loginData();
    if (this.loginUsernameError(data.username) || this.loginPasswordError(data.password)) return;

    this.isLoginSubmitting.set(true);
    this.loginErrorMessage.set(null);
    this.authService.login(this.loginData()).subscribe({
      next: (res) => {
        this.isLoginSubmitting.set(false);
       

        // JWT is stored in an httpOnly cookie by the backend.

        this.router.navigateByUrl('/home');
      },
      error: (err: HttpErrorResponse) => {
        this.isLoginSubmitting.set(false);

        this.loginErrorMessage.set(
          err.error?.error ?? err.error?.message ?? `Login failed (${err.status || 'unknown error'})`
        );
      }
    });
  }

  handleRegister(event: Event) {
    event.preventDefault();
    this.registerSubmitted.set(true);
    
    // Mark all fields as touched to show errors
    this.registerTouched.update(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => (next as any)[k] = true);
      return next;
    });

    const data = this.registerData();
    if (
      this.usernameError(data.username) || 
      this.nameError(data.first_name, 'First Name') ||
      this.nameError(data.last_name, 'Last Name') ||
      this.ageError(data.age) ||
      this.emailError(data.email) || 
      this.passwordError(data.password) ||
      this.confirmPasswordError(data.password, data.confirmPassword)
    ) return;

    if (!this.isFormValid()) return;

    this.isRegisterSubmitting.set(true);
    this.registerErrorMessage.set(null);
    const payload = { ...data, age: Number(data.age) };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isRegisterSubmitting.set(false);
        this.registerErrorMessage.set(null);
        this.showRegistrationSuccessModal.set(true);
        this.cd.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isRegisterSubmitting.set(false);
        this.registerErrorMessage.set(
          err.error?.error ?? `Registration failed (${err.status || 'unknown error'})`
        );
      }
    });
  }

goToLoginFromSuccessModal() {
  this.showRegistrationSuccessModal.set(false);

  this.registerData.set({
    username: '',
    first_name: '',
    last_name: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // RESET TOUCHED STATES
  this.registerTouched.set({
    username: false,
    first_name: false,
    last_name: false,
    age: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  // RESET SUBMITTED STATE
  this.registerSubmitted.set(false);

  // RESET AVAILABILITY
  this.usernameAvailability.set('unknown');
  this.emailAvailability.set('unknown');

  // SWITCH MODE
  this.authMode.set('login');
}
showConfirmPassword = computed(() => {
  return this.passwordError(this.registerData().password) === null;
});
  // --- REACTIVE FORM STATUS ---
isFormValid = computed(() => {
  const data = this.registerData();
  

  const hasConfirmPasswordError =
    this.confirmPasswordError(data.password, data.confirmPassword) !== null;

  const hasUsernameError =
    this.usernameError(data.username) !== null ||
    this.usernameAvailability() === 'taken';

  const hasEmailError =
    this.emailError(data.email) !== null ||
    this.emailAvailability() === 'taken';

  const hasPasswordError =
    this.passwordError(data.password) !== null;

  const hasFirstNameError =
    this.nameError(data.first_name, 'First Name') !== null;

  const hasLastNameError =
    this.nameError(data.last_name, 'Last Name') !== null;

  const hasAgeError =
    this.ageError(data.age) !== null;

  return (
    !hasConfirmPasswordError &&
    !hasUsernameError &&
    !hasEmailError &&
    !hasPasswordError &&
    !hasFirstNameError &&
    !hasLastNameError &&
    !hasAgeError
  );
});
}
