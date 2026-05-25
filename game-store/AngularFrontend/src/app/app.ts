import { Component , signal , inject , OnInit , OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {Navbar} from './navbar/navbar';
import { LoaderComponent } from './loader/loader';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component/footer.component';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet , Navbar , LoaderComponent , CommonModule, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private subscription: Subscription | null = null;
  isPageLoading = signal(true);
  showNavbar = signal(true);

  ngOnInit() {
    this.subscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.showNavbar.set(event.urlAfterRedirects !== '/');
    });

    setTimeout(() => {
      this.isPageLoading.set(false);
    }, 2000);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}

