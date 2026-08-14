import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AdminAuthService } from '../services/admin-auth.service';

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
  isMobile = signal(false);
  mobileSidebarOpen = signal(false);
  logoutModalVisible = signal(false);

  constructor(private router: Router, private authService: AdminAuthService) {}

  ngOnInit(): void {
    this.handleViewportChange();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.handleViewportChange();
  }

  private handleViewportChange(): void {
    const mobile = window.innerWidth <= 900;
    this.isMobile.set(mobile);

    if (!mobile) {
      this.mobileSidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.mobileSidebarOpen.set(!this.mobileSidebarOpen());
  }

  closeMobileSidebar(): void {
    if (this.isMobile()) {
      this.mobileSidebarOpen.set(false);
    }
  }

  requestLogout(): void {
    this.logoutModalVisible.set(true);
  }

  cancelLogout(): void {
    this.logoutModalVisible.set(false);
  }

  confirmLogout(): void {
    this.logoutModalVisible.set(false);
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/admin/login'),
      error: () => this.router.navigateByUrl('/admin/login')
    });
  }
}
