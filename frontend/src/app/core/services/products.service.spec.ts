import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductsService } from './products.service';
import { Product } from '../models/product.model';
import { PaginatedResponse } from '../models/pagination.model';

const API = 'http://localhost:3000/api/products';

const mockProduct: Product = {
  id: 'prod-1', name: 'Laptop', description: 'A powerful laptop',
  price: 999.99, stock: 10, isActive: true, categories: [],
  createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockPage: PaginatedResponse<Product> = {
  data: [mockProduct], total: 1, page: 1, limit: 10,
  totalPages: 1, hasNextPage: false, hasPrevPage: false,
};

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('getAll()', () => {
    it('should GET products with no params by default', () => {
      let result: PaginatedResponse<Product> | undefined;
      service.getAll().subscribe((r) => (result = r));
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
      expect(result).toEqual(mockPage);
    });

    it('should include page param', () => {
      service.getAll({ page: 2 }).subscribe();
      const req = httpMock.expectOne((r) => r.url === API);
      expect(req.request.params.get('page')).toBe('2');
      req.flush(mockPage);
    });

    it('should include search param', () => {
      service.getAll({ search: 'laptop' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === API);
      expect(req.request.params.get('search')).toBe('laptop');
      req.flush(mockPage);
    });

    it('should include categoryId param', () => {
      service.getAll({ categoryId: 'cat-42' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === API);
      expect(req.request.params.get('categoryId')).toBe('cat-42');
      req.flush(mockPage);
    });

    it('should include minPrice and maxPrice params', () => {
      service.getAll({ minPrice: 100, maxPrice: 500 }).subscribe();
      const req = httpMock.expectOne((r) => r.url === API);
      expect(req.request.params.get('minPrice')).toBe('100');
      expect(req.request.params.get('maxPrice')).toBe('500');
      req.flush(mockPage);
    });

    it('should NOT include undefined optional params', () => {
      service.getAll({}).subscribe();
      const req = httpMock.expectOne(API);
      expect(req.request.params.has('search')).toBe(false);
      req.flush(mockPage);
    });
  });

  describe('getById()', () => {
    it('should GET product by id', () => {
      let result: Product | undefined;
      service.getById('prod-1').subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/prod-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create()', () => {
    it('should POST to create a product with the correct body', () => {
      const payload = { name: 'New Product', price: 49.99, stock: 20 };
      service.create(payload).subscribe();
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockProduct);
    });
  });

  describe('update()', () => {
    it('should PATCH to update a product', () => {
      const payload = { price: 799.99 };
      let result: Product | undefined;
      service.update('prod-1', payload).subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/prod-1`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockProduct, price: 799.99 });
      expect(result?.price).toBe(799.99);
    });
  });

  describe('delete()', () => {
    it('should DELETE product at correct URL', () => {
      let result: any;
      service.delete('prod-1').subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/prod-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Product deleted' });
      expect(result?.message).toBe('Product deleted');
    });
  });
});
