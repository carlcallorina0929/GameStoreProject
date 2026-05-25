import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionsComponent } from '../transactions/transactions';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, TransactionsComponent],
  templateUrl: './transactions-page.html',
  styleUrl: './transactions-page.css',
})
export class TransactionsPageComponent {}

