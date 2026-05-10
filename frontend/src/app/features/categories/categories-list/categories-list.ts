import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { CategoryModalComponent } from '../category-modal/category-modal';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, CategoryModalComponent],
  templateUrl: './categories-list.html',
})
export class CategoriesListComponent implements OnInit {
  categories = signal<Category[]>([]);
  filtered = signal<Category[]>([]);
  loading = signal(false);
  error = signal('');
  search = signal('');

  showModal = signal(false);
  showConfirm = signal(false);
  selectedCategory = signal<Category | null>(null);
  modalMode = signal<'create' | 'edit' | 'view'>('create');

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');
    this.categoriesService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.filtered.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load categories');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    const term = this.search().toLowerCase();
    this.filtered.set(
      this.categories().filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term)
      )
    );
  }

  clearSearch(): void {
    this.search.set('');
    this.filtered.set(this.categories());
  }

  openCreate(): void {
    this.selectedCategory.set(null);
    this.modalMode.set('create');
    this.showModal.set(true);
  }

  openView(category: Category): void {
    this.selectedCategory.set(category);
    this.modalMode.set('view');
    this.showModal.set(true);
  }

  openEdit(category: Category): void {
    this.selectedCategory.set(category);
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  openDelete(category: Category): void {
    this.selectedCategory.set(category);
    this.showConfirm.set(true);
  }

  confirmDelete(): void {
    const category = this.selectedCategory();
    if (!category) return;
    this.categoriesService.delete(category.id).subscribe({
      next: () => {
        this.showConfirm.set(false);
        this.selectedCategory.set(null);
        this.loadCategories();
      },
      error: () => this.error.set('Failed to delete category'),
    });
  }

  onModalSaved(): void {
    this.showModal.set(false);
    this.loadCategories();
  }
}