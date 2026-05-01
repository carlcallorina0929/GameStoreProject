import { Routes } from '@angular/router';
import { AuthLandingComponent } from './auth-landing/auth-landing';
import { HomeComponent } from './home/home';

export const routes: Routes = [
  { path: '', component: AuthLandingComponent },
  { path: 'home', component: HomeComponent },
  // { path: 'games', component: GamesComponent },
  // { path: 'cart', component: CartComponent },
];
