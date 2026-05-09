import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, AuthUser } from '../models/auth.model';

const AUTH_API = 'http://localhost:3000/api/auth';
const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

function makeJwt(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function futureJwt(): string {
  return makeJwt({ sub: 'u', exp: Math.floor(Date.now() / 1000) + 3600 });
}

function expiredJwt(): string {
  return makeJwt({ sub: 'u', exp: Math.floor(Date.now() / 1000) - 3600 });
}

const mockUser: AuthUser = {
  id: 'user-1', email: 'test@example.com', firstName: 'John', lastName: 'Doe',
  roles: ['USER'], isActive: true,
};

const adminUser: AuthUser = { ...mockUser, roles: ['ADMIN'] };

const mockAuthResponse: AuthResponse = {
  access_token: futureJwt(), token_type: 'Bearer', expires_in: 3600, user: mockUser,
};

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  function getService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); localStorage.clear(); });

  describe('initialization', () => {
    it('should be created', () => { expect(getService()).toBeTruthy(); });
    it('should have null token when localStorage is empty', () => { expect(getService().getToken()).toBeNull(); });
    it('should load token from localStorage on init', () => {
      localStorage.setItem(TOKEN_KEY, 'stored-token');
      expect(getService().getToken()).toBe('stored-token');
    });
    it('should load user from localStorage on init', () => {
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      expect(getService().currentUser()).toEqual(mockUser);
    });
    it('should return null for user when localStorage value is invalid JSON', () => {
      localStorage.setItem(USER_KEY, 'not-valid-json{{{');
      expect(getService().currentUser()).toBeNull();
    });
  });

  describe('login()', () => {
    it('should POST to /auth/login with the credentials', () => {
      const creds = { email: 'test@example.com', password: 'secret' };
      getService().login(creds).subscribe();
      const req = httpMock.expectOne(`${AUTH_API}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(creds);
      req.flush(mockAuthResponse);
    });

    it('should save token to localStorage after successful login', () => {
      getService().login({ email: '', password: '' }).subscribe();
      httpMock.expectOne(`${AUTH_API}/login`).flush(mockAuthResponse);
      expect(localStorage.getItem(TOKEN_KEY)).toBe(mockAuthResponse.access_token);
    });

    it('should update the token signal after login', () => {
      const service = getService();
      service.login({ email: '', password: '' }).subscribe();
      httpMock.expectOne(`${AUTH_API}/login`).flush(mockAuthResponse);
      expect(service.getToken()).toBe(mockAuthResponse.access_token);
    });

    it('should update currentUser signal after login', () => {
      const service = getService();
      service.login({ email: '', password: '' }).subscribe();
      httpMock.expectOne(`${AUTH_API}/login`).flush(mockAuthResponse);
      expect(service.currentUser()).toEqual(mockUser);
    });
  });

  describe('register()', () => {
    it('should POST to /auth/register', () => {
      const data = { email: 'new@example.com', password: 'pass', firstName: 'Jane', lastName: 'Doe' };
      getService().register(data).subscribe();
      const req = httpMock.expectOne(`${AUTH_API}/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });

    it('should save session on successful register', () => {
      const service = getService();
      service.register({ email: '', password: '', firstName: '', lastName: '' }).subscribe();
      httpMock.expectOne(`${AUTH_API}/register`).flush(mockAuthResponse);
      expect(service.getToken()).toBe(mockAuthResponse.access_token);
    });
  });

  describe('logout()', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem(TOKEN_KEY, 'some-token');
      getService().logout();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('should set token signal to null', () => {
      localStorage.setItem(TOKEN_KEY, 'some-token');
      const service = getService();
      service.logout();
      expect(service.getToken()).toBeNull();
    });

    it('should set currentUser signal to null', () => {
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      const service = getService();
      service.logout();
      expect(service.currentUser()).toBeNull();
    });

    it('should navigate to /login', () => {
      const router = TestBed.inject(Router);
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      getService().logout();
      expect(spy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token is set', () => { expect(getService().isAuthenticated()).toBe(false); });
    it('should return true for a valid non-expired token', () => {
      localStorage.setItem(TOKEN_KEY, futureJwt());
      expect(getService().isAuthenticated()).toBe(true);
    });
    it('should return false for an expired token', () => {
      localStorage.setItem(TOKEN_KEY, expiredJwt());
      expect(getService().isAuthenticated()).toBe(false);
    });
    it('should return false for a malformed token', () => {
      localStorage.setItem(TOKEN_KEY, 'not.a.jwt');
      expect(getService().isAuthenticated()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false when no user is set', () => { expect(getService().isAdmin()).toBe(false); });
    it('should return true when user has ADMIN role', () => {
      localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
      expect(getService().isAdmin()).toBe(true);
    });
    it('should return false when user has only USER role', () => {
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      expect(getService().isAdmin()).toBe(false);
    });
    it('should return true when user has both USER and ADMIN roles', () => {
      const multiRoleUser: AuthUser = { ...mockUser, roles: ['USER', 'ADMIN'] };
      localStorage.setItem(USER_KEY, JSON.stringify(multiRoleUser));
      expect(getService().isAdmin()).toBe(true);
    });
  });
});
