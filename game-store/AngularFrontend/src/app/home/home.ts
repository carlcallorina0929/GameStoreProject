import { Component , OnInit } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { LoaderComponent } from '../loader/loader';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero';
import { Categories } from '../categories/categories';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Navbar , LoaderComponent, CommonModule, HeroComponent, Categories],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  isPageLoading = true;

  ngOnInit() {
    setTimeout(() => {
      console.log('Home timer finished');
      this.isPageLoading = false;
    }, 1000);
  }

  onLoaderComplete(): void {
    this.isPageLoading = false;
  }
}

