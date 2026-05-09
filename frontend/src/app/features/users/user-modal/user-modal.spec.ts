import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserModalComponent } from './user-modal';
import { User } from '../../../core/models/user.model';

const mockUser: User = {
  id: 'u1', email: 'john@example.com', firstName: 'John', lastName: 'Doe',
  isActive: true, roles: [{ id: 'r1', name: 'USER', description: '' }],
  createdAt: '2024-01-15T00:00:00.000Z', updatedAt: '2024-01-15T00:00:00.000Z',
};

describe('UserModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModalComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create', () => {
    expect(TestBed.createComponent(UserModalComponent).componentInstance).toBeTruthy();
  });

  it('should default isOpen to false', () => {
    expect(TestBed.createComponent(UserModalComponent).componentInstance.isOpen).toBe(false);
  });

  it('should default user to null', () => {
    expect(TestBed.createComponent(UserModalComponent).componentInstance.user).toBeNull();
  });

  it('should default mode to "view"', () => {
    expect(TestBed.createComponent(UserModalComponent).componentInstance.mode).toBe('view');
  });

  describe('title getter', () => {
    it('should return "User Details" in view mode', () => {
      const comp = TestBed.createComponent(UserModalComponent).componentInstance;
      comp.mode = 'view';
      expect(comp.title).toBe('User Details');
    });

    it('should return "Edit User" in edit mode', () => {
      const comp = TestBed.createComponent(UserModalComponent).componentInstance;
      comp.mode = 'edit';
      expect(comp.title).toBe('Edit User');
    });
  });

  it('should not throw when ngOnChanges is called', () => {
    const comp = TestBed.createComponent(UserModalComponent).componentInstance;
    expect(() => comp.ngOnChanges()).not.toThrow();
  });

  it('should emit closed when closed.emit() is called', () => {
    const comp = TestBed.createComponent(UserModalComponent).componentInstance;
    const spy = vi.spyOn(comp.closed, 'emit');
    comp.closed.emit();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should show user name when user is provided and modal is open', () => {
    const fixture = TestBed.createComponent(UserModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.componentInstance.user = mockUser;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('John');
    expect(fixture.nativeElement.textContent).toContain('Doe');
  });
});
