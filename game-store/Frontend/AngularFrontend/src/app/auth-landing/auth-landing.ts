import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  templateUrl: './auth-landing.html',
  styleUrl: './auth-landing.css'
})
export class AuthLandingComponent {
  authMode: 'login' | 'register' = 'login';

  setAuthMode(mode: 'login' | 'register') {
    this.authMode = mode;
  }

  handleLogin(event: Event) {
    event.preventDefault();
  }

  handleRegister(event: Event) {
    event.preventDefault();
  }
}
