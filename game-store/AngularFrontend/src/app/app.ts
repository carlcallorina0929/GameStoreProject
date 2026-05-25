import { Component , signal , inject , OnInit , OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {Navbar} from './navbar/navbar';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component/footer.component';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet , Navbar , CommonModule, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private subscription: Subscription | null = null;
  showNavbar = signal(true);
  showFooter = signal(true);

  private updateLayoutFlags(url: string) {
    const isAdminRoute = url.startsWith('/admin');
    this.showNavbar.set(url !== '/' && !isAdminRoute);
    this.showFooter.set(!isAdminRoute);
  }

  ngOnInit() {
    this.updateLayoutFlags(this.router.url);

    this.subscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updateLayoutFlags(event.urlAfterRedirects);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
