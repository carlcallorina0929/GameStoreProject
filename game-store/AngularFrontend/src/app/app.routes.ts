import { Routes } from '@angular/router';
import { AuthLandingComponent } from './auth-landing/auth-landing';
import { HomeComponent } from './home/home';
import { CartComponent } from './cart.component/cart.component';



export const routes: Routes = [
  { path: '', component: AuthLandingComponent },
  { path: 'home', component: HomeComponent },
  { path: 'cart', component: CartComponent }
];
