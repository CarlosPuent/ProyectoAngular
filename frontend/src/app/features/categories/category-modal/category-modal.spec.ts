import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoryModalComponent } from './category-modal';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';

const mockCategory: Category = {
  id: 'cat-1', name: 'Electronics', slug: 'electronics',
  description: 'Electronic devices', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('CategoryModalComponent', () => {
  const mockCategoriesService = { create: vi.fn(), update: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCategoriesService.create.mockReturnValue(of(mockCategory));
    mockCategoriesService.update.mockReturnValue(of(mockCategory));
    await TestBed.configureTestingModule({
      imports: [CategoryModalComponent],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
    }).compileComponents();
  });

  it('should create', () => {
    expect(TestBed.createComponent(CategoryModalComponent).componentInstance).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should start with an invalid form', () => {
      expect(TestBed.createComponent(CategoryModalComponent).componentInstance.form.invalid).toBe(true);
    });
    it('should be valid when name and slug have correct values', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.form.setValue({ name: 'Books', slug: 'books', description: '' });
      expect(comp.form.valid).toBe(true);
    });
  });

  describe('title getter', () => {
    it('should return "New Category" in create mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'create'; expect(comp.title).toBe('New Category');
    });
    it('should return "Edit Category" in edit mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'edit'; expect(comp.title).toBe('Edit Category');
    });
  });

  describe('auto-slug generation', () => {
    it('should auto-generate slug from name in create mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'create';
      comp.form.get('name')?.setValue('My Category');
      expect(comp.form.get('slug')?.value).toBe('my-category');
    });
    it('should NOT auto-generate slug in edit mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'edit';
      comp.form.get('slug')?.setValue('existing-slug');
      comp.form.get('name')?.setValue('Any New Name');
      expect(comp.form.get('slug')?.value).toBe('existing-slug');
    });
  });

  describe('ngOnChanges', () => {
    it('should patch form values in edit mode with category data', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.isOpen = true; comp.mode = 'edit'; comp.category = mockCategory;
      comp.ngOnChanges();
      expect(comp.form.get('name')?.value).toBe('Electronics');
    });
    it('should disable the form in view mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.isOpen = true; comp.mode = 'view'; comp.category = mockCategory;
      comp.ngOnChanges();
      expect(comp.form.disabled).toBe(true);
    });
  });

  describe('onSubmit()', () => {
    it('should NOT call any service when form is invalid', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.onSubmit();
      expect(mockCategoriesService.create).not.toHaveBeenCalled();
    });
    it('should call categoriesService.create() in create mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'create';
      comp.form.setValue({ name: 'Books', slug: 'books', description: '' });
      comp.onSubmit();
      expect(mockCategoriesService.create).toHaveBeenCalledWith({ name: 'Books', slug: 'books', description: '' });
    });
    it('should call categoriesService.update() in edit mode', () => {
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'edit'; comp.category = mockCategory;
      comp.form.setValue({ name: 'Updated', slug: 'updated', description: '' });
      comp.onSubmit();
      expect(mockCategoriesService.update).toHaveBeenCalledWith(mockCategory.id, { name: 'Updated', slug: 'updated', description: '' });
    });
    it('should set error signal from service error response', () => {
      mockCategoriesService.create.mockReturnValue(throwError(() => ({ error: { message: 'Name already exists' } })));
      const comp = TestBed.createComponent(CategoryModalComponent).componentInstance;
      comp.mode = 'create';
      comp.form.setValue({ name: 'Books', slug: 'books', description: '' });
      comp.onSubmit();
      expect(comp.error()).toBe('Name already exists');
    });
  });
});
