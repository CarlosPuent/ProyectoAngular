import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../../core/services/auth.service';
import { AuthUser } from '../../../core/models/auth.model';

const mockUser: AuthUser = {
  id: 'u1', email: 'carlos@example.com', firstName: 'Carlos', lastName: 'Puente',
  roles: ['ADMIN'], isActive: true,
};

describe('NavbarComponent', () => {
  const currentUserSignal = signal<AuthUser | null>(null);
  const mockAuthService = {
    currentUser: currentUserSignal.asReadonly(),
    isAuthenticated: signal(true),
    isAdmin: signal(false),
    getToken: () => null,
    logout: vi.fn(),
  };

  beforeEach(async () => {
    currentUserSignal.set(null);
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();
  });

  it('should create', () => {
    expect(TestBed.createComponent(NavbarComponent).componentInstance).toBeTruthy();
  });

  it('should render the page title "Product Manager"', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent?.trim()).toBe('Product Manager');
  });

  it('should show the first letter of firstName in the avatar when user is set', () => {
    currentUserSignal.set(mockUser);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bg-blue-600').textContent?.trim()).toBe('C');
  });

  it('should display the full name of the current user', () => {
    currentUserSignal.set(mockUser);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const nameEl = fixture.nativeElement.querySelector('p.font-medium') as HTMLElement;
    expect(nameEl.textContent?.trim()).toContain('Carlos');
    expect(nameEl.textContent?.trim()).toContain('Puente');
  });

  it('should display the first role of the current user', () => {
    currentUserSignal.set(mockUser);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const roleEl = fixture.nativeElement.querySelector('p.text-xs.text-gray-500') as HTMLElement;
    expect(roleEl.textContent?.trim()).toBe('ADMIN');
  });
});
