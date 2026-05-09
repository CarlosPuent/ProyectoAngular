import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductModalComponent } from './product-modal';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

const cat1: Category = { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: '', createdAt: '', updatedAt: '' };
const mockProduct: Product = {
  id: 'prod-1', name: 'Laptop', description: 'A great laptop', price: 999.99, stock: 10,
  isActive: true, categories: [cat1], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ProductModalComponent', () => {
  const mockProductsService = { create: vi.fn(), update: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockProductsService.create.mockReturnValue(of(mockProduct));
    mockProductsService.update.mockReturnValue(of(mockProduct));
    await TestBed.configureTestingModule({
      imports: [ProductModalComponent],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compileComponents();
  });

  it('should create', () => {
    expect(TestBed.createComponent(ProductModalComponent).componentInstance).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should start with an invalid form (name and price are required)', () => {
      expect(TestBed.createComponent(ProductModalComponent).componentInstance.form.invalid).toBe(true);
    });
    it('should start with stock defaulting to 0', () => {
      expect(TestBed.createComponent(ProductModalComponent).componentInstance.form.get('stock')?.value).toBe(0);
    });
    it('should start with no selected categories', () => {
      expect(TestBed.createComponent(ProductModalComponent).componentInstance.selectedCategoryIds()).toEqual([]);
    });
  });

  describe('title getter', () => {
    it('should return "New Product" in create mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'create'; expect(comp.title).toBe('New Product');
    });
    it('should return "Edit Product" in edit mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'edit'; expect(comp.title).toBe('Edit Product');
    });
    it('should return "Product Details" in view mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'view'; expect(comp.title).toBe('Product Details');
    });
  });

  describe('ngOnChanges()', () => {
    it('should patch form values from product in edit mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.isOpen = true; comp.mode = 'edit'; comp.product = mockProduct;
      comp.ngOnChanges();
      expect(comp.form.get('name')?.value).toBe('Laptop');
      expect(comp.form.get('price')?.value).toBe(999.99);
    });
    it('should populate selectedCategoryIds from product in edit mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.isOpen = true; comp.mode = 'edit'; comp.product = mockProduct;
      comp.ngOnChanges();
      expect(comp.selectedCategoryIds()).toEqual(['cat-1']);
    });
    it('should disable the form in view mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.isOpen = true; comp.mode = 'view'; comp.product = mockProduct;
      comp.ngOnChanges();
      expect(comp.form.disabled).toBe(true);
    });
  });

  describe('toggleCategory()', () => {
    it('should add a category id when not already selected', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.toggleCategory('cat-1');
      expect(comp.selectedCategoryIds()).toContain('cat-1');
    });
    it('should remove a category id when already selected', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.selectedCategoryIds.set(['cat-1', 'cat-2']);
      comp.toggleCategory('cat-1');
      expect(comp.selectedCategoryIds()).not.toContain('cat-1');
    });
    it('should do nothing in view mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'view';
      comp.toggleCategory('cat-1');
      expect(comp.selectedCategoryIds()).toEqual([]);
    });
  });

  describe('onSubmit()', () => {
    const validValues = { name: 'New Laptop', description: '', price: 799, stock: 5 };

    it('should NOT call any service when form is invalid', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.onSubmit();
      expect(mockProductsService.create).not.toHaveBeenCalled();
    });
    it('should call productsService.create() in create mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'create'; comp.selectedCategoryIds.set(['cat-1']);
      comp.form.setValue(validValues);
      comp.onSubmit();
      expect(mockProductsService.create).toHaveBeenCalledWith({ ...validValues, categoryIds: ['cat-1'] });
    });
    it('should call productsService.update() in edit mode', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'edit'; comp.product = mockProduct;
      comp.form.setValue(validValues);
      comp.onSubmit();
      expect(mockProductsService.update).toHaveBeenCalledWith(mockProduct.id, expect.any(Object));
    });
    it('should set error signal from service error response', () => {
      mockProductsService.create.mockReturnValue(throwError(() => ({ error: { message: 'Product name taken' } })));
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      comp.mode = 'create'; comp.form.setValue(validValues);
      comp.onSubmit();
      expect(comp.error()).toBe('Product name taken');
    });
    it('should set loading = false and emit saved on success', () => {
      const comp = TestBed.createComponent(ProductModalComponent).componentInstance;
      const spy = vi.spyOn(comp.saved, 'emit');
      comp.mode = 'create'; comp.form.setValue(validValues);
      comp.onSubmit();
      expect(comp.loading()).toBe(false); expect(spy).toHaveBeenCalledOnce();
    });
  });
});
