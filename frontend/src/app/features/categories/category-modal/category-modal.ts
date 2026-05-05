import { Component, Input, Output, EventEmitter, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { CategoriesService } from '../../../core/services/categories.service';
import { ModalComponent } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './category-modal.html',
})
export class CategoryModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() category: Category | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
    });

    // Auto-generate slug from name
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (this.mode === 'create') {
        const slug = name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ?? '';
        this.form.get('slug')?.setValue(slug, { emitEvent: false });
      }
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.error.set('');
      if (this.category && (this.mode === 'edit' || this.mode === 'view')) {
        this.form.patchValue({
          name: this.category.name,
          slug: this.category.slug,
          description: this.category.description,
        });
      } else {
        this.form.reset();
      }
      if (this.mode === 'view') this.form.disable();
      else this.form.enable();
    }
  }

  get title(): string {
    return { create: 'New Category', edit: 'Edit Category', view: 'Category Details' }[this.mode];
  }

  get isView(): boolean { return this.mode === 'view'; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const request$ = this.mode === 'edit' && this.category
      ? this.categoriesService.update(this.category.id, this.form.value)
      : this.categoriesService.create(this.form.value);

    request$.subscribe({
      next: () => { this.loading.set(false); this.saved.emit(); },
      error: (err) => {
        this.error.set(err.error?.message || 'Operation failed');
        this.loading.set(false);
      },
    });
  }
}