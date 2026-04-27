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

  // --- SIGNALS FOR REACTIVE STATE ---
  authMode = signal<'login' | 'register'>('login');
  
  loginData = signal({ username: '', password: '' });
  registerData = signal({
    username: '',
    first_name: '',
    last_name: '',
    age: '',
    email: '',
    password: ''
  });
loginErrorMessage = signal<string | null>(null);
  loginTouched = signal({ username: false, password: false });
  registerTouched = signal({
    username: false,
    first_name: false,
    last_name: false,
    age: false,
    email: false,
    password: false
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
  }

  onLoginInput(field: 'username' | 'password', value: string) {
    this.loginData.update(prev => ({ ...prev, [field]: value }));
  }

  onRegisterInput(field: keyof ReturnType<typeof this.registerData>, value: string) {
    let val = value;
    
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

  // --- VALIDATION LOGIC ---

  usernameError(v: string) {
    const t = v.trim();
    if (!t) return 'Username is required.';
    if (!/^[A-Za-z0-9_]{6,30}$/.test(t)) return 'Invalid username format.';
    return null;
  }

  nameError(v: string, fieldName: string) {
    const trimmed = v.trim();
    if (!trimmed) return `${fieldName} is required.`;
    if (!/^[A-Za-z\s]+$/.test(trimmed)) return `${fieldName} must only contain letters.`;
    return null;
  }

  ageError(v: string) {
    if (!v || v.trim().length === 0) return 'Age is required.';
    if (Number(v) < 13) return 'Must be at least 13.';
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
    if (this.usernameError(data.username) || this.passwordError(data.password)) return;

    this.isLoginSubmitting.set(true);
    this.authService.login(this.loginData()).subscribe({
  next: (res) => {
    this.isLoginSubmitting.set(false);
        console.log('Login successful', res);
        
        // 1. Clear any old errors
        this.loginErrorMessage.set(null);

        this.router.navigateByUrl('/home');
        localStorage.setItem('token', res.token);


  },
  error: (err: HttpErrorResponse) => {
    this.isLoginSubmitting.set(false);
    
    // Check if the backend returned a 401 (Unauthorized)
    if (err.status === 401) {
      // Maps your backend's { error: "Invalid..." } to the signal
      this.loginErrorMessage.set(err.error?.error || 'Invalid Username or Password');
    } else {
      this.loginErrorMessage.set('An unexpected error occurred.');
    }
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
      this.passwordError(data.password)
    ) return;

    if (this.usernameAvailability() !== 'available' || this.emailAvailability() !== 'available') return;

    this.isRegisterSubmitting.set(true);
    const payload = { ...data, age: Number(data.age) };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isRegisterSubmitting.set(false);
        this.showRegistrationSuccessModal.set(true);
        this.cd.detectChanges();
      },
      error: () => this.isRegisterSubmitting.set(false)
    });
  }

  goToLoginFromSuccessModal() {
    this.showRegistrationSuccessModal.set(false);
    this.registerData.set({ username: '', first_name: '', last_name: '', age: '', email: '', password: '' });
    this.usernameAvailability.set('unknown');
    this.emailAvailability.set('unknown');
    this.authMode.set('login');
  }

  // --- REACTIVE FORM STATUS ---
 isFormValid = computed(() => {
    const data = this.registerData();
    
    // Check all fields for "null" errors and "empty" status
    const hasUsernameError = this.usernameError(data.username) !== null || this.usernameAvailability() !== 'available';
    const hasEmailError = this.emailError(data.email) !== null || this.emailAvailability() !== 'available';
    const hasPasswordError = this.passwordError(data.password) !== null;
    const hasFirstNameError = this.nameError(data.first_name, 'First Name') !== null;
    const hasLastNameError = this.nameError(data.last_name, 'Last Name') !== null;
    const hasAgeError = this.ageError(data.age) !== null;

    // The button only enables if ALL of these are false
    return !hasUsernameError && 
           !hasEmailError && 
           !hasPasswordError && 
           !hasFirstNameError && 
           !hasLastNameError && 
           !hasAgeError;
  });
}