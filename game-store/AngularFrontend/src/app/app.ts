import { Component , signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Navbar} from './navbar/navbar';
import { LoaderComponent } from './loader/loader';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet , Navbar , LoaderComponent , CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isPageLoading = signal(true);

  ngOnInit() {
    setTimeout(() => {
      this.isPageLoading.set(false);
    }, 2000);
  }
}


