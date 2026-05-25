import { Component, input, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule ,],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoaderComponent {

  // Input signal from parent
  isLoading = input<boolean>(true);

}