import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router , RouterLink , RouterLinkActive  } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule , NzIconModule , RouterLink , RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  menuOpen = false;
  accountMenuOpen = false;
  // Controls logout confirmation modal visibility (signal matches the app's existing pattern).
  logoutModalOpen = signal(false);

  constructor(private router: Router) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleAccountMenu() {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  goToProfile() {
    this.accountMenuOpen = false;
    this.menuOpen = false;
    this.router.navigate(['/profile']);
  }

  goToProfileFromLink(event: Event) {
    event.preventDefault();
    this.goToProfile();
  }

  // Opens the confirmation modal instead of logging out immediately.
  openLogoutModal() {
    this.logoutModalOpen.set(true);
    this.accountMenuOpen = false;
  }

  // Closes the confirmation modal without logging out.
  closeLogoutModal() {
    this.logoutModalOpen.set(false);
  }

  // Performs the actual logout (moved from the old logout() body).
  confirmLogout() {
    localStorage.removeItem('token'); // remove login
    localStorage.removeItem('userId'); // remove userId
    this.accountMenuOpen = false;
    this.logoutModalOpen.set(false);

    // Login/auth landing route is the root path.
    this.router.navigate(['']);
  }

  // Kept for compatibility if referenced elsewhere; now opens the modal.
  logout() {
    this.openLogoutModal();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('.account-menu')) {
      this.accountMenuOpen = false;
    }
  }
}
