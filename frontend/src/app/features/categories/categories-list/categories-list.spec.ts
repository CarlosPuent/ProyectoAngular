import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoriesListComponent } from './categories-list';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';

const cat1: Category = { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: 'Devices', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };
const cat2: Category = { id: 'cat-2', name: 'Books', slug: 'books', description: 'Literature', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };
const mockCategories = [cat1, cat2];

describe('CategoriesListComponent', () => {
  const mockCategoriesService = { getAll: vi.fn(), delete: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCategoriesService.getAll.mockReturnValue(of(mockCategories));
    mockCategoriesService.delete.mockReturnValue(of({ message: 'deleted' }));
    await TestBed.configureTestingModule({
      imports: [CategoriesListComponent],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
    }).compileComponents();
  });

  it('should create', () => {
    expect(TestBed.createComponent(CategoriesListComponent).componentInstance).toBeTruthy();
  });

  describe('loadCategories()', () => {
    it('should call categoriesService.getAll() on init', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      expect(mockCategoriesService.getAll).toHaveBeenCalledOnce();
    });
    it('should populate categories and filtered signals on success', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.categories()).toEqual(mockCategories);
    });
    it('should set error signal on load failure', () => {
      mockCategoriesService.getAll.mockReturnValue(throwError(() => new Error('Network error')));
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.error()).toBe('Failed to load categories');
    });
  });

  describe('onSearch()', () => {
    it('should filter by category name', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.search.set('elec'); comp.onSearch();
      expect(comp.filtered()).toEqual([cat1]);
    });
    it('should return all categories when search is empty', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.search.set(''); comp.onSearch();
      expect(comp.filtered()).toEqual(mockCategories);
    });
  });

  describe('clearSearch()', () => {
    it('should reset the search and restore filtered', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.search.set('elec'); comp.onSearch(); comp.clearSearch();
      expect(comp.search()).toBe(''); expect(comp.filtered()).toEqual(mockCategories);
    });
  });

  describe('modal state management', () => {
    it('openCreate() should set modalMode to create and show the modal', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.openCreate();
      expect(comp.modalMode()).toBe('create'); expect(comp.showModal()).toBe(true);
    });
    it('openEdit() should set selectedCategory and mode to edit', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      fixture.componentInstance.openEdit(cat1);
      expect(fixture.componentInstance.modalMode()).toBe('edit');
      expect(fixture.componentInstance.selectedCategory()).toEqual(cat1);
    });
    it('openDelete() should set selectedCategory and show confirm dialog', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      fixture.componentInstance.openDelete(cat1);
      expect(fixture.componentInstance.showConfirm()).toBe(true);
    });
  });

  describe('confirmDelete()', () => {
    it('should call categoriesService.delete() with the selected category id', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.openDelete(cat1); comp.confirmDelete();
      expect(mockCategoriesService.delete).toHaveBeenCalledWith('cat-1');
    });
    it('should reload categories after successful delete', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.openDelete(cat1); comp.confirmDelete();
      expect(mockCategoriesService.getAll).toHaveBeenCalledTimes(2);
    });
    it('should do nothing if selectedCategory is null', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      fixture.componentInstance.confirmDelete();
      expect(mockCategoriesService.delete).not.toHaveBeenCalled();
    });
    it('should set error on delete failure', () => {
      mockCategoriesService.delete.mockReturnValue(throwError(() => new Error('Server error')));
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.openDelete(cat1); comp.confirmDelete();
      expect(comp.error()).toBe('Failed to delete category');
    });
  });

  describe('onModalSaved()', () => {
    it('should close the modal and reload categories', () => {
      const fixture = TestBed.createComponent(CategoriesListComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.openCreate(); comp.onModalSaved();
      expect(comp.showModal()).toBe(false);
      expect(mockCategoriesService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});
