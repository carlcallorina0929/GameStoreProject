import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../models/cart';
import { CartService } from '../services/cart.service';
import {NzIconModule} from 'ng-zorro-antd/icon';



@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule , NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  private cartService = inject(CartService);

  // STATE
  cartItems = signal<CartItem[]>([]);
  isCheckingOut = signal<boolean>(false);
  receiptItems = signal<CartItem[]>([]);
  loading = signal<boolean>(true);

  // COMPUTED
  cartCount = computed(() => this.cartItems().length);

  cartTotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.final_price, 0)
  );

  // INIT → LOAD FROM BACKEND
  ngOnInit() {
    this.loadCart();
  }

loadCart() {
  this.loading.set(true);

  this.cartService.getCart().subscribe({
    next: (items) => {
      console.log('CART ITEMS:', items);

      this.cartItems.set(items);

      console.log('SIGNAL VALUE:', this.cartItems());

      this.loading.set(false);
    },
    error: (err) => {
      console.error(err);
      this.loading.set(false);
    }
  });
}

  // REMOVE ITEM (BACKEND INTEGRATED)
  removeItem(game_id: number) {
    this.cartService.removeFromCart(game_id).subscribe({
      next: () => {
        this.cartItems.update(items =>
          items.filter(item => item.game_id !== game_id)
        );
      },
      error: (err) => {
        console.error('Failed to remove item:', err);
      }
    });
  }

  // CLEAR CART (OPTIONAL LOCAL ONLY OR LOOP BACKEND LATER)
  clearCart() {
    this.cartItems.set([]);
  }

  // CHECKOUT (still frontend simulation)
  onCheckout() {
    if (this.cartItems().length === 0) return;

    this.receiptItems.set([...this.cartItems()]);
    this.isCheckingOut.set(true);
  }

  closeModal() {
    this.isCheckingOut.set(false);
    this.cartItems.set([]);
  }


}