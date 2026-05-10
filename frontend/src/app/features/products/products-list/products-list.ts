import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { PaginatedResponse } from '../../../core/models/pagination.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ProductModalComponent } from '../product-modal/product-modal';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ProductModalComponent, BadgeComponent],
  templateUrl: './products-list.html',
})
export class ProductsListComponent implements OnInit {
  response = signal<PaginatedResponse<Product> | null>(null);
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal('');

  // Filters
  search = signal('');
  selectedCategory = signal('');
  currentPage = signal(1);
  pageSize = 10;

  // Modal states
  showModal = signal(false);
  showConfirm = signal(false);
  selectedProduct = signal<Product | null>(null);
  modalMode = signal<'create' | 'edit' | 'view'>('create');

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');
    this.productsService.getAll({
      page: this.currentPage(),
      limit: this.pageSize,
      search: this.search() || undefined,
      categoryId: this.selectedCategory() || undefined,
    }).subscribe({
      next: (res) => { this.response.set(res); this.loading.set(false); },
      error: () => { this.error.set('Failed to load products'); this.loading.set(false); },
    });
  }

  loadCategories(): void {
    this.categoriesService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onCategoryFilter(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters(): void {
    this.search.set('');
    this.selectedCategory.set('');
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  openCreate(): void {
    this.selectedProduct.set(null);
    this.modalMode.set('create');
    this.showModal.set(true);
  }

  openView(product: Product): void {
    this.selectedProduct.set(product);
    this.modalMode.set('view');
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.selectedProduct.set(product);
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  openDelete(product: Product): void {
    this.selectedProduct.set(product);
    this.showConfirm.set(true);
  }

  confirmDelete(): void {
    const product = this.selectedProduct();
    if (!product) return;
    this.productsService.delete(product.id).subscribe({
      next: () => {
        this.showConfirm.set(false);
        this.selectedProduct.set(null);
        this.loadProducts();
      },
      error: () => this.error.set('Failed to delete product'),
    });
  }

  onModalSaved(): void {
    this.showModal.set(false);
    this.loadProducts();
  }

  get pages(): number[] {
    const total = this.response()?.totalPages ?? 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}