import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  menuOpen = false;
  isModalOpen = false;
  authMode: 'login' | 'register' = 'login';

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  openAuthModal(mode: 'login' | 'register' = 'login') {
    this.authMode = mode;
    this.isModalOpen = true;
    this.menuOpen = false;
  }

  closeAuthModal() {
    this.isModalOpen = false;
  }

  setAuthMode(mode: 'login' | 'register') {
    this.authMode = mode;
  }

  handleLogin(event: Event) {
    event.preventDefault();
  }

  handleRegister(event: Event) {
    event.preventDefault();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isModalOpen) {
      this.closeAuthModal();
    }
  }
}
