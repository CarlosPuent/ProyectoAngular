import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriesService } from './categories.service';
import { Category } from '../models/category.model';

const API = 'http://localhost:3000/api/categories';

const mockCategory: Category = {
  id: 'cat-1', name: 'Electronics', slug: 'electronics',
  description: 'Electronic devices', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('getAll()', () => {
    it('should GET all categories without params', () => {
      let result: Category[] | undefined;
      service.getAll().subscribe((r) => (result = r));
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush([mockCategory]);
      expect(result).toEqual([mockCategory]);
    });

    it('should include search query param when provided', () => {
      service.getAll('tech').subscribe();
      const req = httpMock.expectOne(`${API}?search=tech`);
      expect(req.request.params.get('search')).toBe('tech');
      req.flush([]);
    });

    it('should NOT include search param when not provided', () => {
      service.getAll().subscribe();
      const req = httpMock.expectOne(API);
      expect(req.request.params.has('search')).toBe(false);
      req.flush([]);
    });
  });

  describe('getById()', () => {
    it('should GET category by id', () => {
      let result: Category | undefined;
      service.getById('cat-1').subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/cat-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('create()', () => {
    it('should POST to create a category with correct body', () => {
      const payload = { name: 'New Category', slug: 'new-category', description: 'Desc' };
      service.create(payload).subscribe();
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockCategory);
    });
  });

  describe('update()', () => {
    it('should PATCH to update a category', () => {
      const payload = { name: 'Updated Name' };
      let result: Category | undefined;
      service.update('cat-1', payload).subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/cat-1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...mockCategory, name: 'Updated Name' });
      expect(result?.name).toBe('Updated Name');
    });
  });

  describe('delete()', () => {
    it('should DELETE category at correct URL', () => {
      let result: { message: string } | undefined;
      service.delete('cat-1').subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/cat-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Category deleted successfully' });
      expect(result?.message).toBe('Category deleted successfully');
    });
  });
});
