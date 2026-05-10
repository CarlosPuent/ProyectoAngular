import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { RegisterComponent } from './register';
import { AuthService } from '../../../core/services/auth.service';

const mockAuthResponse = {
  access_token: 'token', token_type: 'Bearer', expires_in: 3600,
  user: { id: '1', email: 'a@a.com', firstName: 'Jane', lastName: 'Doe', roles: ['USER'], isActive: true },
};

const validFormValue = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', password: 'secure123' };

describe('RegisterComponent', () => {
  const mockAuthService = { register: vi.fn() };

  function setup() {
    mockAuthService.register.mockReturnValue(of(mockAuthResponse));
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthService.register.mockReturnValue(of(mockAuthResponse));
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();
  });

  it('should create', () => { expect(setup().componentInstance).toBeTruthy(); });

  describe('form initialization', () => {
    it('should initialize with four empty fields', () => {
      expect(setup().componentInstance.form.value).toEqual({ firstName: '', lastName: '', email: '', password: '' });
    });
    it('should start with an invalid form', () => { expect(setup().componentInstance.form.invalid).toBe(true); });
  });

  describe('initial signal state', () => {
    it('should start with loading = false', () => { expect(setup().componentInstance.loading()).toBe(false); });
    it('should start with empty error', () => { expect(setup().componentInstance.error()).toBe(''); });
  });

  describe('field validation', () => {
    it('should be invalid when firstName is shorter than 2 characters', () => {
      const { componentInstance: comp } = setup();
      comp.firstName?.setValue('A');
      expect(comp.firstName?.errors?.['minlength']).toBeTruthy();
    });
    it('should be invalid for a malformed email', () => {
      const { componentInstance: comp } = setup();
      comp.email?.setValue('not-email');
      expect(comp.email?.errors?.['email']).toBeTruthy();
    });
    it('should be invalid when password shorter than 6 characters', () => {
      const { componentInstance: comp } = setup();
      comp.password?.setValue('abc');
      expect(comp.password?.errors?.['minlength']).toBeTruthy();
    });
    it('should be valid when all fields are correctly filled', () => {
      const { componentInstance: comp } = setup();
      comp.form.setValue(validFormValue);
      expect(comp.form.valid).toBe(true);
    });
  });

  describe('onSubmit() with invalid form', () => {
    it('should NOT call auth.register() when form is invalid', () => {
      setup().componentInstance.onSubmit();
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit() with valid form — success', () => {
    it('should call auth.register() with the form values', () => {
      const { componentInstance: comp } = setup();
      comp.form.setValue(validFormValue);
      comp.onSubmit();
      expect(mockAuthService.register).toHaveBeenCalledWith(validFormValue);
    });
    it('should navigate to /dashboard on success', () => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate');
      const { componentInstance: comp } = setup();
      comp.form.setValue(validFormValue);
      comp.onSubmit();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
    it('should set loading = true while the request is in flight', () => {
      mockAuthService.register.mockReturnValue(new Subject().asObservable());
      const fixture = TestBed.createComponent(RegisterComponent);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue(validFormValue);
      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.loading()).toBe(true);
    });
  });

  describe('onSubmit() with valid form — HTTP error', () => {
    it('should set error signal from HTTP error response', () => {
      mockAuthService.register.mockReturnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
      const fixture = TestBed.createComponent(RegisterComponent);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue(validFormValue);
      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.error()).toBe('Email already exists');
    });
    it('should fall back to "Registration failed" when error message is missing', () => {
      mockAuthService.register.mockReturnValue(throwError(() => ({ error: {} })));
      const fixture = TestBed.createComponent(RegisterComponent);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue(validFormValue);
      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.error()).toBe('Registration failed');
    });
  });

  describe('template rendering', () => {
    it('should render an email input field', () => {
      expect(setup().nativeElement.querySelector('input[type="email"]')).toBeTruthy();
    });
    it('should show the error banner when error is set', () => {
      const fixture = setup();
      fixture.componentInstance.error.set('Something went wrong');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.bg-red-50')).toBeTruthy();
    });
  });
});
