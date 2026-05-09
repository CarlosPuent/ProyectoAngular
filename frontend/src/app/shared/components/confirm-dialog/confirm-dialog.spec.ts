import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('default values', () => {
    it('should default isOpen to false', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      expect(fixture.componentInstance.isOpen).toBe(false);
    });

    it('should default title to "Confirm action"', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      expect(fixture.componentInstance.title).toBe('Confirm action');
    });

    it('should default message to "Are you sure you want to proceed?"', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      expect(fixture.componentInstance.message).toBe('Are you sure you want to proceed?');
    });

    it('should default confirmLabel to "Confirm"', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      expect(fixture.componentInstance.confirmLabel).toBe('Confirm');
    });

    it('should default cancelLabel to "Cancel"', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      expect(fixture.componentInstance.cancelLabel).toBe('Cancel');
    });

    it('should default danger to true', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      expect(fixture.componentInstance.danger).toBe(true);
    });
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
    });

    it('should render when isOpen is true', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.fixed')).toBeTruthy();
    });
  });

  describe('content rendering', () => {
    it('should display the title', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.componentInstance.title = 'Delete product';
      fixture.detectChanges();
      const h3 = fixture.nativeElement.querySelector('h3') as HTMLElement;
      expect(h3.textContent?.trim()).toBe('Delete product');
    });

    it('should display the message', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.componentInstance.message = 'This cannot be undone';
      fixture.detectChanges();
      const p = fixture.nativeElement.querySelector('p') as HTMLElement;
      expect(p.textContent?.trim()).toBe('This cannot be undone');
    });

    it('should display custom confirm label', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.componentInstance.confirmLabel = 'Yes, delete it';
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const confirmBtn = buttons[buttons.length - 1];
      expect(confirmBtn.textContent?.trim()).toBe('Yes, delete it');
    });

    it('should display custom cancel label', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.componentInstance.cancelLabel = 'Keep it';
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const cancelBtn = buttons[0];
      expect(cancelBtn.textContent?.trim()).toBe('Keep it');
    });
  });

  describe('danger icon', () => {
    it('should show the danger icon when danger is true', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.componentInstance.danger = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.bg-red-100')).toBeTruthy();
    });

    it('should hide the danger icon when danger is false', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.componentInstance.danger = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.bg-red-100')).toBeNull();
    });
  });

  describe('output events', () => {
    it('should emit confirmed when confirm button is clicked', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.detectChanges();
      const spy = vi.spyOn(fixture.componentInstance.confirmed, 'emit');
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      buttons[buttons.length - 1].click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should emit cancelled when cancel button is clicked', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = true;
      fixture.detectChanges();
      const spy = vi.spyOn(fixture.componentInstance.cancelled, 'emit');
      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      buttons[0].click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should not emit confirmed when dialog is closed', () => {
      const fixture = TestBed.createComponent(ConfirmDialogComponent);
      fixture.componentInstance.isOpen = false;
      fixture.detectChanges();
      const spy = vi.spyOn(fixture.componentInstance.confirmed, 'emit');
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
