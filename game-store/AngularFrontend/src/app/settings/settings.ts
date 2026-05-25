import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from '../profile/profile';
import { TransactionsComponent } from '../transactions/transactions';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ProfileComponent, TransactionsComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  activeSection = signal<'profile' | 'transactions'>('profile');

  setSection(section: 'profile' | 'transactions') {
    this.activeSection.set(section);
  }
}

