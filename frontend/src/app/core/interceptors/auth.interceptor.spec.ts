import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

const TEST_URL = '/api/test';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  const tokenSignal = signal<string | null>(null);
  const mockAuthService = {
    getToken: () => tokenSignal(),
    logout: vi.fn(),
    isAuthenticated: signal(false),
    currentUser: signal(null),
  };

  beforeEach(() => {
    tokenSignal.set(null);
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  describe('Authorization header', () => {
    it('should add Authorization Bearer header when token exists', () => {
      tokenSignal.set('my-jwt-token');
      http.get(TEST_URL).subscribe();
      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
      req.flush({});
    });

    it('should NOT add Authorization header when token is null', () => {
      tokenSignal.set(null);
      http.get(TEST_URL).subscribe();
      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should pass through successful responses without modification', () => {
      tokenSignal.set(null);
      let result: any;
      http.get(TEST_URL).subscribe((r) => (result = r));
      httpMock.expectOne(TEST_URL).flush({ data: 'ok' });
      expect(result).toEqual({ data: 'ok' });
    });
  });

  describe('401 error handling', () => {
    it('should call auth.logout() on 401 response', () => {
      tokenSignal.set('expired-token');
      http.get(TEST_URL).subscribe({ error: () => {} });
      httpMock.expectOne(TEST_URL).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(mockAuthService.logout).toHaveBeenCalledOnce();
    });

    it('should navigate to /login on 401 response', () => {
      tokenSignal.set('expired-token');
      http.get(TEST_URL).subscribe({ error: () => {} });
      httpMock.expectOne(TEST_URL).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should still propagate the 401 error downstream', () => {
      tokenSignal.set('expired-token');
      let caughtError: any;
      http.get(TEST_URL).subscribe({ error: (e) => (caughtError = e) });
      httpMock.expectOne(TEST_URL).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(caughtError.status).toBe(401);
    });
  });

  describe('non-401 error handling', () => {
    it('should NOT call auth.logout() on 403 error', () => {
      http.get(TEST_URL).subscribe({ error: () => {} });
      httpMock.expectOne(TEST_URL).flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should propagate non-401 errors with the original status code', () => {
      let caughtError: any;
      http.get(TEST_URL).subscribe({ error: (e) => (caughtError = e) });
      httpMock.expectOne(TEST_URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
      expect(caughtError.status).toBe(404);
    });
  });
});
