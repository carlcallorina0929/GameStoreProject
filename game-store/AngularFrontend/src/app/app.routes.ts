import { Routes } from '@angular/router';
import { AuthLandingComponent } from './auth-landing/auth-landing';
import { HomeComponent } from './home/home';
import { CartComponent } from './cart.component/cart.component';
import { LibraryComponent } from './library/library.component';
import { ProfileComponent } from './profile/profile';
import { SettingsComponent } from './settings/settings';
import { TransactionsPageComponent } from './transactions-page/transactions-page';



export const routes: Routes = [
  { path: '', component: AuthLandingComponent },
  { path: 'home', component: HomeComponent },
  { path: 'library', component: LibraryComponent },
  { path: 'cart', component: CartComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'transactions', component: TransactionsPageComponent },
  { path: 'settings', component: SettingsComponent }
];
