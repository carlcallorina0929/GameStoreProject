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

  private splitGames(gamesBought: string | null | undefined): string[] {
    const raw = String(gamesBought ?? '').trim();
    if (!raw) return [];
    return raw
      .split(/,\s*/g)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  gamesPreview(gamesBought: string | null | undefined): string {
    const titles = this.splitGames(gamesBought);
    if (titles.length === 0) return 'N/A';
    if (titles.length <= 3) return titles.join(', ');
    return `${titles.slice(0, 3).join(', ')}, ...`;
  }

  hasGamesOverflow(gamesBought: string | null | undefined): boolean {
    return this.splitGames(gamesBought).length > 3;
  }

  gamesOverflowTooltip(gamesBought: string | null | undefined): string {
    const titles = this.splitGames(gamesBought);
    if (titles.length <= 3) return '';
    // Show only the "excess" titles in the tooltip.
    return titles.slice(3).join('\n');
  }

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
