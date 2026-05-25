import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  isCollapsed = false;
  logoutModalVisible = signal(false);

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  onCollapsedChange(value: boolean): void {
    this.isCollapsed = value;
  }

  requestLogout(): void {
    this.logoutModalVisible.set(true);
  }

  cancelLogout(): void {
    this.logoutModalVisible.set(false);
  }

  confirmLogout(): void {
    this.logoutModalVisible.set(false);
    localStorage.removeItem('admin_token');
    this.router.navigateByUrl('/admin/login');
  }
}
