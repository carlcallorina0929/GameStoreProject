import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CartItem } from '../models/cart';
import { CartService } from '../services/cart.service';
import { CheckoutService } from '../services/checkout.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzIconModule, NzStepsModule, NzPaginationModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  private cartService = inject(CartService);
  private checkoutService = inject(CheckoutService);
  private notification = inject(NzNotificationService);

  // STATE
  cartItems = signal<CartItem[]>([]);
  isCheckingOut = signal<boolean>(false);
  receiptItems = signal<CartItem[]>([]);
  loading = signal<boolean>(true);
  processingPayment = signal<boolean>(false);
  currentPage = signal(1);
pageSize = 5;

  // CHECKOUT FLOW STATE
  checkoutStep = signal<number>(0); // 0: Review, 1: Payment, 2: Processing, 3: Complete
  paymentError = signal<string | null>(null);
  transactionRef = signal<string>('');
  orderId = signal<number | null>(null);

  paginatedCartItems = computed(() => {
  const items = this.cartItems();
  const start = (this.currentPage() - 1) * this.pageSize;
  return items.slice(start, start + this.pageSize);
});
totalPages = computed(() => {
  return Math.ceil(this.cartItems().length / this.pageSize);
});

  // PAYMENT FORM DATA
  private fb = inject(FormBuilder);

  cardNumberValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').replace(/\s/g, '');
    return /^\d{16}$/.test(value) ? null : { invalidCardNumber: true };
  }

  expiryValidator = (control: AbstractControl): ValidationErrors | null => {
    const expiry = String(control.value ?? '').trim();
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return { invalidExpiry: true };

    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) return { invalidExpiry: true };

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { expiredCard: true };
    }

    return null;
  }

  paymentForm: FormGroup = this.fb.group({
    cardholderName: ['', [Validators.required, Validators.pattern(/^[A-Za-z ]+$/)]],
    cardNumber: ['', [Validators.required, this.cardNumberValidator]],
    expiry: ['', [Validators.required, this.expiryValidator]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
  });

  // COMPUTED
  cartCount = computed(() => this.cartItems().length);
  cartTotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.final_price, 0)
  );

  // STEPS ARRAY FOR NG-ZORRO
  steps = [
    { title: 'Review Cart', description: '' },
    { title: 'Payment Info', description: '' },
    { title: 'Processing', description: '' },
    { title: 'Complete', description: '' }
  ];

  ngOnInit() {
    this.loadCart();

    const cardholderControl = this.paymentForm.get('cardholderName');
    cardholderControl?.valueChanges.subscribe((value: string) => {
      const trimmed = String(value ?? '').trim();
      if (trimmed !== value) {
        cardholderControl.setValue(trimmed, { emitEvent: false });
      }
    });
  }

  loadCart() {
    this.loading.set(true);

    this.cartService.getCart().subscribe({
      next: (items) => {
        console.log('CART ITEMS:', items);
        this.cartItems.set(items);
        console.log('SIGNAL VALUE:', this.cartItems());
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

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
    this.currentPage.set(1);
  }

  clearCart() {
    this.cartItems.set([]);
  }

  /**
   * STEP 0: Open checkout modal
   */
onCheckout() {
  if (this.cartItems().length === 0) return;

  this.paymentError.set(null);

  console.log('onCheckout() called - starting checkout');

  this.checkoutService.startCheckout().subscribe({
    next: (res: any) => {
      console.log('startCheckout response:', res);

      if (res && res.success && res.orderId) {
        this.orderId.set(res.orderId);

        // now proceed with UI transition
        this.receiptItems.set([...this.cartItems()]);
        this.isCheckingOut.set(true);
        this.checkoutStep.set(0);
        this.resetPaymentForm();
      } else {
        this.paymentError.set(res.error || 'Failed to start checkout');
      }
    },
    error: (err) => {
      console.error('startCheckout request failed:', err);
      this.paymentError.set('Unable to start checkout. Please try again.');
    }
  });
}

  /**
   * STEP 1: Move to payment information
   */
  goToPaymentStep() {
  this.paymentError.set(null);
  this.checkoutStep.set(1);
}

  get cardholderNameControl() {
    return this.paymentForm.get('cardholderName') as FormControl;
  }

  get cardNumberControl() {
    return this.paymentForm.get('cardNumber') as FormControl;
  }

  get expiryControl() {
    return this.paymentForm.get('expiry') as FormControl;
  }

  get cvvControl() {
    return this.paymentForm.get('cvv') as FormControl;
  }

  /**
   * STEP 1 → STEP 2: Process payment
   */
  processPayment() {
    this.paymentForm.markAllAsTouched();

    if (this.paymentForm.invalid) {
      this.paymentError.set('Please fix the highlighted payment fields');
      return;
    }

    // Clear previous errors
    this.paymentError.set(null);
    this.processingPayment.set(true);
    this.checkoutStep.set(2); // Move to processing step

    const payment = {
      cardNumber: String(this.cardNumberControl.value ?? '').replace(/\s/g, ''),
      expiry: String(this.expiryControl.value ?? '').trim(),
      cvv: String(this.cvvControl.value ?? '').trim(),
      cardholderName: String(this.cardholderNameControl.value ?? '').trim()
    };

    this.checkoutService.processCheckout(payment, this.orderId() ?? undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.checkoutStep.set(3);
          this.transactionRef.set(response.transactionReference || '');
          this.orderId.set(response.orderId ?? null);
          this.processingPayment.set(false);

          this.notification.create(
            'success',
            'Payment Successful',
            `Transaction Reference: ${response.transactionReference}`
          );
        } else {
          this.checkoutStep.set(1);
          this.paymentError.set(response.error || 'Payment failed');
          this.processingPayment.set(false);

          this.notification.create(
            'error',
            'Payment Failed',
            response.error || 'Please check your card details and try again.'
          );
        }
      },
      error: (err) => {
        console.error('Checkout error:', err);
        this.checkoutStep.set(1);

        const serverMsg = err?.error?.error || err?.error?.errorCode || err?.error?.message || err?.message;
        const displayMsg = serverMsg || 'Network error. Please try again.';
        this.paymentError.set(displayMsg);
        this.processingPayment.set(false);

        this.notification.create(
          'error',
          'Error',
          displayMsg
        );
      }
    });
  }

  /**
   * Reset payment form
   */
  resetPaymentForm() {
    this.paymentForm.reset();
  }

  /**
   * Close modal and complete checkout
   */
  closeModal() {
    if (this.checkoutStep() === 3) {
      // Successful payment - clear cart and reset
      this.cartItems.set([]);
      this.isCheckingOut.set(false);
      this.checkoutStep.set(0);
      this.resetPaymentForm();
    } else {
      // Cancel checkout: if there is a pending order, tell backend to cancel it
      const oid = this.orderId();
      if (oid) {
        this.checkoutService.cancelCheckout(oid).subscribe({
          next: () => {
            // ignore
          },
          error: (err) => console.error('cancelCheckout failed:', err)
        });
      }

      this.isCheckingOut.set(false);
      this.checkoutStep.set(0);
      this.resetPaymentForm();
      this.paymentError.set(null);
      this.orderId.set(null);
    }
  }

  /**
   * Format cardholder name to letters and spaces only
   */
  formatCardholderName(event: any) {
    let value = String(event.target.value ?? '');
    value = value.replace(/[^A-Za-z ]+/g, '');
    this.paymentForm.patchValue({ cardholderName: value }, { emitEvent: false });
  }

  /**
   * Format card number with spaces (every 4 digits)
   */
  formatCardNumber(event: any) {
    let value = String(event.target.value ?? '').replace(/\s/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    this.paymentForm.patchValue({ cardNumber: formatted }, { emitEvent: false });
  }

  /**
   * Format expiry (MM/YY)
   */
  formatExpiry(event: any) {
    let value = String(event.target.value ?? '').replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.paymentForm.patchValue({ expiry: value }, { emitEvent: false });
  }

  /**
   * CVV - only numbers
   */
  formatCVV(event: any) {
    let value = String(event.target.value ?? '').replace(/\D/g, '').slice(0, 3);
    this.paymentForm.patchValue({ cvv: value }, { emitEvent: false });
  }
}
