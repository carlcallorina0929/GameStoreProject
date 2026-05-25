import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SettingsService,
  SettingsTransaction,
} from '../services/settings.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class TransactionsComponent implements OnInit {
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  transactions = signal<SettingsTransaction[]>([]);

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.settingsService.getTransactions().subscribe({
      next: (res) => {
        this.transactions.set(res?.transactions ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.error ?? 'Failed to load transaction history'
        );
        this.loading.set(false);
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      case 'refunded':
        return 'status-refunded';
      default:
        return 'status-default';
    }
  }
}

