import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';

import { AdminAnalyticsService } from '../services/admin-analytics.service';

type SummaryResponse = {
  totalUsers: number;
  totalGames: number;
  totalOrders: number;
  totalRevenue: number;
};

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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzSkeletonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);

  loading = signal(true);
  summary = signal({
    totalUsers: 0,
    totalGames: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  sales = signal<SalesPoint[]>([]);
  topGames = signal<TopGamePoint[]>([]);
  registrations = signal<RegistrationPoint[]>([]);
  topFreeGames = signal<TopFreeGamePoint[]>([]);

  maxSalesRevenue = computed(() => Math.max(...this.sales().map((x) => Number(x.revenue)), 1));
  maxRegistrations = computed(() =>
    Math.max(...this.registrations().map((x) => Number(x.registrations)), 1),
  );

  ngOnInit(): void {
    this.analyticsService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
      },
    });
    this.analyticsService.getCharts().subscribe({
      next: (response) => {
        this.sales.set(response.salesVolume);
        this.topGames.set(response.topSellingGames);
        this.registrations.set(response.registrationTrends);
        this.topFreeGames.set(response.topFreeGames);
      },
      complete: () => this.loading.set(false),
    });
  }

  getRevenuePercent(value: number): number {
    return Math.max(6, (Number(value) / this.maxSalesRevenue()) * 100);
  }

  getRegistrationsPercent(value: number): number {
    return Math.max(6, (Number(value) / this.maxRegistrations()) * 100);
  }
}
