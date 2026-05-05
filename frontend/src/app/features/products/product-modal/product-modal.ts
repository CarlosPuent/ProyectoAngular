import { Component, Input, Output, EventEmitter, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product, CreateProductRequest } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { ProductsService } from '../../../core/services/products.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    BadgeComponent,
  ],
  templateUrl: './product-modal.html',
})
export class ProductModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() product: Product | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() categories: Category[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = signal(false);
  error = signal('');
  selectedCategoryIds = signal<string[]>([]);

  constructor(private fb: FormBuilder, private productsService: ProductsService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.error.set('');
      if (this.product && (this.mode === 'edit' || this.mode === 'view')) {
        this.form.patchValue({
          name: this.product.name,
          description: this.product.description,
          price: this.product.price,
          stock: this.product.stock,
        });
        this.selectedCategoryIds.set(this.product.categories?.map(c => c.id) ?? []);
      } else {
        this.form.reset({ stock: 0 });
        this.selectedCategoryIds.set([]);
      }
      if (this.mode === 'view') this.form.disable();
      else this.form.enable();
    }
  }

  get title(): string {
    return { create: 'New Product', edit: 'Edit Product', view: 'Product Details' }[this.mode];
  }

  get isView(): boolean { return this.mode === 'view'; }

  toggleCategory(id: string): void {
    if (this.isView) return;
    this.selectedCategoryIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  isCategorySelected(id: string): boolean {
    return this.selectedCategoryIds().includes(id);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const payload: CreateProductRequest = {
      ...this.form.value,
      categoryIds: this.selectedCategoryIds(),
    };

    const request$ = this.mode === 'edit' && this.product
      ? this.productsService.update(this.product.id, payload)
      : this.productsService.create(payload);

    request$.subscribe({
      next: () => { this.loading.set(false); this.saved.emit(); },
      error: (err) => {
        this.error.set(err.error?.message || 'Operation failed');
        this.loading.set(false);
      },
    });
  }
}