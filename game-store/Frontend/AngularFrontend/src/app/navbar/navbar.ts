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

 accountMenuOpen = false;

 toggleAccountMenu() {
  this.accountMenuOpen = !this.accountMenuOpen;
}

logout() {
  localStorage.removeItem('token'); // remove login
  this.accountMenuOpen = false;
}

 @HostListener('document:click', ['$event'])
onClickOutside(event: Event) {
  const target = event.target as HTMLElement;

  if (!target.closest('.account-menu')) {
    this.accountMenuOpen = false;
  }
}
}
