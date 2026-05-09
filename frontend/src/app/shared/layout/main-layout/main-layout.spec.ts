import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MainLayoutComponent } from './main-layout';
import { AuthService } from '../../../core/services/auth.service';

describe('MainLayoutComponent', () => {
  const mockAuthService = {
    isAdmin: signal(false),
    currentUser: signal(null),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    expect(TestBed.createComponent(MainLayoutComponent).componentInstance).toBeTruthy();
  });

  it('should render the outer container div', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.flex.h-screen')).toBeTruthy();
  });

  it('should include app-sidebar in the template', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeTruthy();
  });

  it('should include app-navbar in the template', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeTruthy();
  });

  it('should include a router-outlet', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('should wrap content in a main element', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('main')).toBeTruthy();
  });
});
