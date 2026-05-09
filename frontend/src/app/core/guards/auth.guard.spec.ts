import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, publicGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function makeMockAuth(initialAuthenticated: boolean) {
  const isAuthenticatedSignal = signal(initialAuthenticated);
  return {
    isAuthenticatedSignal,
    mockAuthService: {
      isAuthenticated: isAuthenticatedSignal,
      currentUser: signal(null),
      getToken: () => null,
    },
  };
}

const emptyRoute = {} as ActivatedRouteSnapshot;
const emptyState = {} as RouterStateSnapshot;

describe('authGuard', () => {
  const { isAuthenticatedSignal, mockAuthService } = makeMockAuth(false);

  beforeEach(() => {
    isAuthenticatedSignal.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it('should return true when user is authenticated', () => {
    isAuthenticatedSignal.set(true);
    const result = TestBed.runInInjectionContext(() => authGuard(emptyRoute, emptyState));
    expect(result).toBe(true);
  });

  it('should return a UrlTree when user is NOT authenticated', () => {
    isAuthenticatedSignal.set(false);
    const result = TestBed.runInInjectionContext(() => authGuard(emptyRoute, emptyState));
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('should redirect to /login when not authenticated', () => {
    isAuthenticatedSignal.set(false);
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => authGuard(emptyRoute, emptyState));
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('should NOT redirect to /login when authenticated', () => {
    isAuthenticatedSignal.set(true);
    const result = TestBed.runInInjectionContext(() => authGuard(emptyRoute, emptyState));
    expect(result).not.toBeInstanceOf(UrlTree);
  });
});

describe('publicGuard', () => {
  const { isAuthenticatedSignal, mockAuthService } = makeMockAuth(false);

  beforeEach(() => {
    isAuthenticatedSignal.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it('should return true when user is NOT authenticated (allows public route)', () => {
    isAuthenticatedSignal.set(false);
    const result = TestBed.runInInjectionContext(() => publicGuard(emptyRoute, emptyState));
    expect(result).toBe(true);
  });

  it('should return a UrlTree when user IS authenticated', () => {
    isAuthenticatedSignal.set(true);
    const result = TestBed.runInInjectionContext(() => publicGuard(emptyRoute, emptyState));
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('should redirect to /dashboard when user is already authenticated', () => {
    isAuthenticatedSignal.set(true);
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => publicGuard(emptyRoute, emptyState));
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('should NOT redirect to /dashboard when not authenticated', () => {
    isAuthenticatedSignal.set(false);
    const result = TestBed.runInInjectionContext(() => publicGuard(emptyRoute, emptyState));
    expect(result).not.toBeInstanceOf(UrlTree);
  });
});
