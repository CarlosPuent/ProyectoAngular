import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsListComponent } from './products-list';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { PaginatedResponse } from '../../../core/models/pagination.model';

const cat1: Category = { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: '', createdAt: '', updatedAt: '' };
const mockProduct: Product = { id: 'prod-1', name: 'Laptop', description: 'A laptop', price: 999, stock: 5, isActive: true, categories: [cat1], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };
const mockProduct2: Product = { id: 'prod-2', name: 'Phone', description: 'A phone', price: 499, stock: 0, isActive: false, categories: [], createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' };

function makePage(data: Product[], overrides: Partial<PaginatedResponse<Product>> = {}): PaginatedResponse<Product> {
  return { data, total: data.length, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false, ...overrides };
}

describe('ProductsListComponent', () => {
  const mockProductsService = { getAll: vi.fn(), delete: vi.fn(), create: vi.fn(), update: vi.fn() };
  const mockCategoriesService = { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };

  function setup() {
    const fixture = TestBed.createComponent(ProductsListComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockProductsService.getAll.mockReturnValue(of(makePage([mockProduct, mockProduct2])));
    mockProductsService.delete.mockReturnValue(of({ message: 'deleted' }));
    mockProductsService.create.mockReturnValue(of(mockProduct));
    mockProductsService.update.mockReturnValue(of(mockProduct));
    mockCategoriesService.getAll.mockReturnValue(of([cat1]));

    await TestBed.configureTestingModule({
      imports: [ProductsListComponent],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    }).compileComponents();
  });

  it('should create', () => { expect(setup().componentInstance).toBeTruthy(); });

  describe('ngOnInit', () => {
    it('should call productsService.getAll() on init', () => {
      setup();
      expect(mockProductsService.getAll).toHaveBeenCalledWith({ page: 1, limit: 10, search: undefined, categoryId: undefined });
    });
    it('should call categoriesService.getAll() on init', () => {
      setup(); expect(mockCategoriesService.getAll).toHaveBeenCalledOnce();
    });
    it('should set response signal on success', () => {
      const fixture = setup();
      expect(fixture.componentInstance.response()).not.toBeNull();
    });
  });

  describe('loadProducts()', () => {
    it('should set error signal on failure', () => {
      mockProductsService.getAll.mockReturnValue(throwError(() => new Error('Network error')));
      const fixture = setup();
      expect(fixture.componentInstance.error()).toBe('Failed to load products');
    });
  });

  describe('onSearch()', () => {
    it('should reset currentPage to 1', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.currentPage.set(3); comp.onSearch();
      expect(comp.currentPage()).toBe(1);
    });
    it('should call getAll() with the current search term', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.search.set('laptop'); comp.onSearch();
      expect(mockProductsService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'laptop', page: 1 }));
    });
  });

  describe('clearFilters()', () => {
    it('should reset search, category, and page', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.search.set('laptop'); comp.selectedCategory.set('cat-1'); comp.currentPage.set(3);
      comp.clearFilters();
      expect(comp.search()).toBe(''); expect(comp.selectedCategory()).toBe(''); expect(comp.currentPage()).toBe(1);
    });
  });

  describe('goToPage()', () => {
    it('should update currentPage and reload', () => {
      const fixture = setup();
      fixture.componentInstance.goToPage(3);
      expect(fixture.componentInstance.currentPage()).toBe(3);
      expect(mockProductsService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));
    });
  });

  describe('pages getter', () => {
    it('should return empty array when response is null', () => {
      const comp = TestBed.createComponent(ProductsListComponent).componentInstance;
      expect(comp.pages).toEqual([]);
    });
    it('should return page numbers from 1 to totalPages', () => {
      const comp = TestBed.createComponent(ProductsListComponent).componentInstance;
      comp.response.set(makePage([mockProduct], { totalPages: 3 }));
      expect(comp.pages).toEqual([1, 2, 3]);
    });
  });

  describe('modal state management', () => {
    it('openCreate() should set mode to create and show modal', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.openCreate();
      expect(comp.modalMode()).toBe('create'); expect(comp.showModal()).toBe(true);
    });
    it('openEdit() should set selectedProduct and mode to edit', () => {
      const fixture = setup();
      fixture.componentInstance.openEdit(mockProduct);
      expect(fixture.componentInstance.modalMode()).toBe('edit');
      expect(fixture.componentInstance.selectedProduct()).toEqual(mockProduct);
    });
    it('openDelete() should set selectedProduct and show confirm dialog', () => {
      const fixture = setup();
      fixture.componentInstance.openDelete(mockProduct);
      expect(fixture.componentInstance.showConfirm()).toBe(true);
    });
  });

  describe('confirmDelete()', () => {
    it('should call productsService.delete() with the product id', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.openDelete(mockProduct); comp.confirmDelete();
      expect(mockProductsService.delete).toHaveBeenCalledWith('prod-1');
    });
    it('should reload products after successful delete', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.openDelete(mockProduct); comp.confirmDelete();
      expect(mockProductsService.getAll).toHaveBeenCalledTimes(2);
    });
    it('should do nothing when selectedProduct is null', () => {
      const fixture = setup();
      fixture.componentInstance.confirmDelete();
      expect(mockProductsService.delete).not.toHaveBeenCalled();
    });
    it('should set error on delete failure', () => {
      mockProductsService.delete.mockReturnValue(throwError(() => new Error('Server error')));
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.openDelete(mockProduct); comp.confirmDelete();
      expect(comp.error()).toBe('Failed to delete product');
    });
  });

  describe('onModalSaved()', () => {
    it('should close modal and reload products', () => {
      const fixture = setup();
      const comp = fixture.componentInstance;
      comp.openCreate(); comp.onModalSaved();
      expect(comp.showModal()).toBe(false);
      expect(mockProductsService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});
