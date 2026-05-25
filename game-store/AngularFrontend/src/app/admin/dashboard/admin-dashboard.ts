import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { AdminAnalyticsService } from '../services/admin-analytics.service';

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

  ngOnInit(): void {
    this.analyticsService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
