import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { User } from '../models/user.model';

const API = 'http://localhost:3000/api/users';

const mockUser: User = {
  id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe',
  isActive: true, roles: [{ id: 'role-1', name: 'USER', description: 'Regular user' }],
  createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('getAll()', () => {
    it('should GET all users', () => {
      let result: User[] | undefined;
      service.getAll().subscribe((r) => (result = r));
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getById()', () => {
    it('should GET user by id', () => {
      let result: User | undefined;
      service.getById('user-1').subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/user-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getMe()', () => {
    it('should GET /users/me endpoint', () => {
      let result: User | undefined;
      service.getMe().subscribe((r) => (result = r));
      const req = httpMock.expectOne(`${API}/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('assignRole()', () => {
    it('should PATCH /users/:id/roles with role in body', () => {
      const roleData = { role: 'ADMIN' };
      service.assignRole('user-1', roleData).subscribe();
      const req = httpMock.expectOne(`${API}/user-1/roles`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(roleData);
      req.flush(mockUser);
    });
  });

  describe('removeRole()', () => {
    it('should DELETE /users/:id/roles with role in body', () => {
      const roleData = { role: 'ADMIN' };
      service.removeRole('user-1', roleData).subscribe();
      const req = httpMock.expectOne(`${API}/user-1/roles`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(roleData);
      req.flush(mockUser);
    });
  });
});
