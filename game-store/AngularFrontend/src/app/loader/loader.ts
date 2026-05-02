import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, OnInit, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoaderComponent implements OnInit {
  /**
   * input() defines the property coming from the parent.
   * Matches HTML: @if (isLoading())
   */
  isLoading = input<boolean>(true);
 

  /**
   * Internal state to ensure the loader disappears.
   * We initialize it to true.
   */
  isVisible = signal(true);

  private cdr = inject(ChangeDetectorRef);

  constructor() {
    /**
     * This effect bridges the input from the parent to our local visibility state.
     * If the parent (HomeComponent) sets isLoading to false, we hide.
     */
    effect(() => {
      if (!this.isLoading()) {
        this.isVisible.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit() {
    /**
     * SELF-MANAGED BACKUP TIMER
     * Even if the parent logic fails, this timer will hide the loader
     * automatically after 2 seconds.
     */
    setTimeout(() => {
      this.isVisible.set(false);
      
      // Force an immediate synchronous update of the view
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      console.log('LoaderComponent: Visibility timer finished.');
    }, 2000);
  }
}