import { Component , OnInit , signal } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { LoaderComponent } from '../loader/loader';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero';
import { Categories } from '../categories/categories';
import {GamesComponent} from '../games/games';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Navbar , LoaderComponent, CommonModule, HeroComponent, Categories , GamesComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  isPageLoading = signal(true);
selectedGenre = signal<string | null>(null);

onGenreSelected(genre: string | null) {
  this.selectedGenre.set(genre);
}
  ngOnInit() {
    setTimeout(() => {
      console.log('Home timer finished');
      this.isPageLoading.set(false);
    }, 1000);
  }

  onLoaderComplete(): void {
    this.isPageLoading.set(false);
  }
}

