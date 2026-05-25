import { Routes } from '@angular/router';
import { AuthLandingComponent } from './auth-landing/auth-landing';
import { HomeComponent } from './home/home';
import { CartComponent } from './cart.component/cart.component';
import { LibraryComponent } from './library/library.component';
import { ProfileComponent } from './profile/profile';
import { SettingsComponent } from './settings/settings';
import { TransactionsPageComponent } from './transactions-page/transactions-page';
import { adminAuthGuard } from './admin/admin-auth.guard';
import { userAuthGuard } from './user-auth.guard';



export const routes: Routes = [
  { path: '', component: AuthLandingComponent },
  { path: 'auth-landing', component: AuthLandingComponent },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/admin-login').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./admin/layout/admin-layout').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./admin/users/admin-users').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'games',
        loadComponent: () =>
          import('./admin/games/admin-games').then((m) => m.AdminGamesComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./admin/analytics/admin-analytics').then((m) => m.AdminAnalyticsComponent),
      },
    ],
  },
  { path: 'home', component: HomeComponent, canActivate: [userAuthGuard] },
  { path: 'library', component: LibraryComponent, canActivate: [userAuthGuard] },
  { path: 'cart', component: CartComponent, canActivate: [userAuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [userAuthGuard] },
  { path: 'transactions', component: TransactionsPageComponent, canActivate: [userAuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [userAuthGuard] },
  { path: '**', redirectTo: 'auth-landing' }
];
