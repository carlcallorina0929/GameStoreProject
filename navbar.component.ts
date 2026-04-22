// navbar.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  menuOpen = false;
  isModalOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.isModalOpen = false; // Close modal if menu is toggled
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    this.menuOpen = false; // Close menu if modal is toggled
  }
}
