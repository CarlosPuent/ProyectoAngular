import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../core/models/auth.model';

const mockProductsPage = { data: [], total: 42, page: 1, limit: 1, totalPages: 42, hasNextPage: true, hasPrevPage: false };
const mockCategories = [
  { id: 'c1', name: 'Electronics', slug: 'electronics', description: '', createdAt: '', updatedAt: '' },
  { id: 'c2', name: 'Books', slug: 'books', description: '', createdAt: '', updatedAt: '' },
];
const mockUsers = [
  { id: 'u1', email: 'a@a.com', firstName: 'A', lastName: 'B', isActive: true, roles: [], createdAt: '', updatedAt: '' },
];
const mockAdminUser: AuthUser = { id: 'u0', email: 'admin@admin.com', firstName: 'Admin', lastName: 'User', roles: ['ADMIN'], isActive: true };

describe('DashboardComponent', () => {
  const isAdminSignal = signal(false);
  const currentUserSignal = signal<AuthUser | null>(null);
  const mockAuthService = { isAdmin: isAdminSignal, currentUser: currentUserSignal.asReadonly() };
  const mockProductsService = { getAll: vi.fn() };
  const mockCategoriesService = { getAll: vi.fn() };
  const mockUsersService = { getAll: vi.fn() };

  function setup() {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    isAdminSignal.set(false);
    currentUserSignal.set(null);
    vi.clearAllMocks();
    mockProductsService.getAll.mockReturnValue(of(mockProductsPage));
    mockCategoriesService.getAll.mockReturnValue(of(mockCategories));
    mockUsersService.getAll.mockReturnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compileComponents();
  });

  it('should create', () => { expect(setup().componentInstance).toBeTruthy(); });

  describe('ngOnInit', () => {
    it('should call productsService.getAll() on init', () => {
      setup();
      expect(mockProductsService.getAll).toHaveBeenCalledWith({ limit: 1 });
    });
    it('should call categoriesService.getAll() on init', () => {
      setup();
      expect(mockCategoriesService.getAll).toHaveBeenCalledOnce();
    });
  });

  describe('non-admin user', () => {
    beforeEach(() => isAdminSignal.set(false));

    it('should show only 2 stat cards (Products + Categories)', () => {
      expect(setup().componentInstance.stats().length).toBe(2);
    });
    it('should set Products stat value from API response', () => {
      expect(setup().componentInstance.stats().find((s) => s.label === 'Total Products')?.value).toBe(42);
    });
    it('should NOT call usersService.getAll()', () => {
      setup();
      expect(mockUsersService.getAll).not.toHaveBeenCalled();
    });
    it('should set loading = false after stats load', () => {
      expect(setup().componentInstance.loading()).toBe(false);
    });
  });

  describe('admin user', () => {
    beforeEach(() => { isAdminSignal.set(true); currentUserSignal.set(mockAdminUser); });

    it('should show 3 stat cards (Products + Categories + Users)', () => {
      expect(setup().componentInstance.stats().length).toBe(3);
    });
    it('should call usersService.getAll()', () => {
      setup();
      expect(mockUsersService.getAll).toHaveBeenCalledOnce();
    });
  });

  describe('template rendering', () => {
    it('should show the dashboard heading', () => {
      const fixture = setup();
      expect(fixture.nativeElement.querySelector('h2').textContent?.trim()).toBe('Dashboard');
    });
    it('should show "Manage Users" link only for admin', () => {
      isAdminSignal.set(true);
      const fixture = setup();
      fixture.detectChanges();
      const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLElement>;
      expect(Array.from(links).some((l) => l.textContent?.includes('Manage Users'))).toBe(true);
    });
    it('should NOT show "Manage Users" link for non-admin', () => {
      isAdminSignal.set(false);
      const fixture = setup();
      fixture.detectChanges();
      const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLElement>;
      expect(Array.from(links).some((l) => l.textContent?.includes('Manage Users'))).toBe(false);
    });
  });
});
