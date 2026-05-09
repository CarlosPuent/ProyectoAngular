import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';

const mockAuthResponse = {
  access_token: 'token', token_type: 'Bearer', expires_in: 3600,
  user: { id: '1', email: 'a@a.com', firstName: 'A', lastName: 'B', roles: ['USER'], isActive: true },
};

describe('LoginComponent', () => {
  const mockAuthService = { login: vi.fn() };

  function setup() {
    mockAuthService.login.mockReturnValue(of(mockAuthResponse));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthService.login.mockReturnValue(of(mockAuthResponse));
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();
  });

  it('should create', () => { expect(setup().componentInstance).toBeTruthy(); });

  describe('form initialization', () => {
    it('should initialize the form with empty fields', () => {
      expect(setup().componentInstance.form.value).toEqual({ email: '', password: '' });
    });
    it('should start with an invalid form', () => { expect(setup().componentInstance.form.invalid).toBe(true); });
    it('should expose email control via getter', () => {
      const { componentInstance: comp } = setup();
      expect(comp.email).toBe(comp.form.get('email'));
    });
  });

  describe('initial signal state', () => {
    it('should start with loading = false', () => { expect(setup().componentInstance.loading()).toBe(false); });
    it('should start with empty error message', () => { expect(setup().componentInstance.error()).toBe(''); });
    it('should start with showPassword = false', () => { expect(setup().componentInstance.showPassword()).toBe(false); });
  });

  describe('email validation', () => {
    it('should be invalid when email is empty', () => {
      const { componentInstance: comp } = setup();
      comp.email?.setValue('');
      expect(comp.email?.errors?.['required']).toBeTruthy();
    });
    it('should be invalid for a malformed email', () => {
      const { componentInstance: comp } = setup();
      comp.email?.setValue('not-an-email');
      expect(comp.email?.errors?.['email']).toBeTruthy();
    });
    it('should be valid for a correct email', () => {
      const { componentInstance: comp } = setup();
      comp.email?.setValue('user@example.com');
      expect(comp.email?.valid).toBe(true);
    });
  });

  describe('password validation', () => {
    it('should be invalid when password is shorter than 6 characters', () => {
      const { componentInstance: comp } = setup();
      comp.password?.setValue('abc');
      expect(comp.password?.errors?.['minlength']).toBeTruthy();
    });
    it('should be valid when password has 6 or more characters', () => {
      const { componentInstance: comp } = setup();
      comp.password?.setValue('secure');
      expect(comp.password?.valid).toBe(true);
    });
  });

  describe('onSubmit() with invalid form', () => {
    it('should NOT call auth.login() when form is invalid', () => {
      const { componentInstance: comp } = setup();
      comp.form.setValue({ email: '', password: '' });
      comp.onSubmit();
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
    it('should mark all controls as touched on invalid submit', () => {
      const { componentInstance: comp } = setup();
      comp.form.setValue({ email: '', password: '' });
      comp.onSubmit();
      expect(comp.email?.touched).toBe(true);
      expect(comp.password?.touched).toBe(true);
    });
  });

  describe('onSubmit() with valid form — success', () => {
    it('should call auth.login() with the form values', () => {
      const { componentInstance: comp } = setup();
      comp.form.setValue({ email: 'user@example.com', password: 'secret1' });
      comp.onSubmit();
      expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret1' });
    });
    it('should set loading = true while the request is in flight', () => {
      mockAuthService.login.mockReturnValue(new Subject().asObservable());
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ email: 'a@a.com', password: 'password' });
      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.loading()).toBe(true);
    });
    it('should navigate to /dashboard on success', () => {
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate');
      const { componentInstance: comp } = setup();
      comp.form.setValue({ email: 'user@example.com', password: 'secret1' });
      comp.onSubmit();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('onSubmit() with valid form — HTTP error', () => {
    it('should set the error signal on HTTP failure', () => {
      mockAuthService.login.mockReturnValue(throwError(() => ({ error: { message: { error: 'Wrong credentials' } } })));
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ email: 'a@a.com', password: 'wrong1' });
      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.error()).toBe('Wrong credentials');
    });
    it('should reset loading to false on HTTP error', () => {
      mockAuthService.login.mockReturnValue(throwError(() => ({ error: {} })));
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ email: 'a@a.com', password: 'wrong1' });
      fixture.componentInstance.onSubmit();
      expect(fixture.componentInstance.loading()).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should render the email input', () => {
      expect(setup().nativeElement.querySelector('input[type="email"]')).toBeTruthy();
    });
    it('should show error banner when error signal is set', () => {
      const fixture = setup();
      fixture.componentInstance.error.set('Login failed');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.bg-red-50')).toBeTruthy();
    });
    it('should toggle password field type when showPassword changes', () => {
      const fixture = setup();
      const input = fixture.nativeElement.querySelector('input[formControlName="password"]') as HTMLInputElement;
      expect(input.type).toBe('password');
      fixture.componentInstance.showPassword.set(true);
      fixture.detectChanges();
      expect(input.type).toBe('text');
    });
  });
});
