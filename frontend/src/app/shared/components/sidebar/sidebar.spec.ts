import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { SidebarComponent } from './sidebar';
import { AuthService } from '../../../core/services/auth.service';

describe('SidebarComponent', () => {
  // Writable signals shared across tests — reset in beforeEach
  const isAdminSignal = signal(false);
  const currentUserSignal = signal<{ firstName?: string; lastName?: string; email?: string } | null>(
    null,
  );

  const mockAuthService = {
    isAdmin: isAdminSignal,
    currentUser: currentUserSignal.asReadonly(),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    isAdminSignal.set(false);
    currentUserSignal.set(null);
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should inject the AuthService', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    expect(fixture.componentInstance.auth).toBe(mockAuthService);
  });

  describe('nav items', () => {
    it('should define 4 total navItems', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      expect(fixture.componentInstance.navItems.length).toBe(4);
    });

    it('should show 3 links for a non-admin user (no Users link)', () => {
      isAdminSignal.set(false);
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const links = fixture.nativeElement.querySelectorAll('nav a');
      expect(links.length).toBe(3);
    });

    it('should show 4 links for an admin user', () => {
      isAdminSignal.set(true);
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const links = fixture.nativeElement.querySelectorAll('nav a');
      expect(links.length).toBe(4);
    });

    it('should NOT include Users link for non-admin', () => {
      isAdminSignal.set(false);
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const linkTexts = Array.from(fixture.nativeElement.querySelectorAll('nav a')).map(
        (a) => (a as HTMLElement).textContent ?? '',
      );
      expect(linkTexts.some((t) => t.includes('Users'))).toBe(false);
    });

    it('should include Users link for admin', () => {
      isAdminSignal.set(true);
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const linkTexts = Array.from(fixture.nativeElement.querySelectorAll('nav a')).map(
        (a) => (a as HTMLElement).textContent ?? '',
      );
      expect(linkTexts.some((t) => t.includes('Users'))).toBe(true);
    });

    it('should always include Dashboard, Products, and Categories links', () => {
      isAdminSignal.set(false);
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const linkTexts = Array.from(fixture.nativeElement.querySelectorAll('nav a')).map(
        (a) => (a as HTMLElement).textContent ?? '',
      );
      expect(linkTexts.some((t) => t.includes('Dashboard'))).toBe(true);
      expect(linkTexts.some((t) => t.includes('Products'))).toBe(true);
      expect(linkTexts.some((t) => t.includes('Categories'))).toBe(true);
    });
  });

  describe('collapse state', () => {
    it('should start in expanded state (isCollapsed = false)', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      expect(fixture.componentInstance.isCollapsed()).toBe(false);
    });

    it('should collapse when toggleCollapse() is called once', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      fixture.componentInstance.toggleCollapse();
      expect(fixture.componentInstance.isCollapsed()).toBe(true);
    });

    it('should expand again when toggleCollapse() is called twice', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      fixture.componentInstance.toggleCollapse();
      fixture.componentInstance.toggleCollapse();
      expect(fixture.componentInstance.isCollapsed()).toBe(false);
    });

    it('should apply w-64 class when expanded', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
      expect(aside.classList).toContain('w-64');
    });

    it('should apply w-16 class when collapsed', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      fixture.componentInstance.isCollapsed.set(true);
      fixture.detectChanges();
      const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
      expect(aside.classList).toContain('w-16');
    });

    it('should show the sidebar text label when expanded', () => {
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const brandText = fixture.nativeElement.querySelector('aside span') as HTMLElement;
      expect(brandText.textContent?.trim()).toBe('Angular App');
    });
  });

  describe('user info rendering', () => {
    it('should show U as avatar letter when no user is set', () => {
      currentUserSignal.set(null);
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const avatarDiv = fixture.nativeElement.querySelector('.bg-blue-600') as HTMLElement;
      expect(avatarDiv.textContent?.trim()).toBe('U');
    });

    it('should show first letter of firstName as avatar', () => {
      currentUserSignal.set({ firstName: 'Carlos', lastName: 'P', email: 'carlos@test.com' });
      const fixture = TestBed.createComponent(SidebarComponent);
      fixture.detectChanges();
      const avatarDiv = fixture.nativeElement.querySelector('.bg-blue-600') as HTMLElement;
      expect(avatarDiv.textContent?.trim()).toBe('C');
    });
  });
});
