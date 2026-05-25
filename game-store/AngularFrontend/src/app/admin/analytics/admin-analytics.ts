import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AdminAnalyticsService } from '../services/admin-analytics.service';

type SalesPoint = {
  sale_date: string;
  orders_count: number;
  revenue: number;
};

type TopGamePoint = {
  game_id: number;
  title: string;
  units_sold: number;
  revenue: number;
};

type RegistrationPoint = {
  register_date: string;
  registrations: number;
};

type TopFreeGamePoint = {
  game_id: number;
  title: string;
  owners_count: number;
};

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTableModule, NzSkeletonModule],
  templateUrl: './admin-analytics.html',
  styleUrl: './admin-analytics.css',
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);

  loading = signal(true);
  sales = signal<SalesPoint[]>([]);
  topGames = signal<TopGamePoint[]>([]);
  registrations = signal<RegistrationPoint[]>([]);
  topFreeGames = signal<TopFreeGamePoint[]>([]);

  maxSalesRevenue = computed(() => Math.max(...this.sales().map((x) => Number(x.revenue)), 1));
  maxRegistrations = computed(() =>
    Math.max(...this.registrations().map((x) => Number(x.registrations)), 1),
  );

  ngOnInit(): void {
    this.analyticsService.getCharts().subscribe({
      next: (response) => {
        this.sales.set(response.salesVolume);
        this.topGames.set(response.topSellingGames);
        this.registrations.set(response.registrationTrends);
        this.topFreeGames.set(response.topFreeGames);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getRevenuePercent(value: number): number {
    return Math.max(6, (Number(value) / this.maxSalesRevenue()) * 100);
  }

  getRegistrationsPercent(value: number): number {
    return Math.max(6, (Number(value) / this.maxRegistrations()) * 100);
  }
}
