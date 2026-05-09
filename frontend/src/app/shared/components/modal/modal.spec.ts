import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal';

describe('ModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should default isOpen to false', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    expect(fixture.componentInstance.isOpen).toBe(false);
  });

  it('should default size to md', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    expect(fixture.componentInstance.size).toBe('md');
  });

  it('should not render overlay when isOpen is false', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
  });

  it('should render overlay when isOpen is true', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeTruthy();
  });

  it('should display the title when open', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.componentInstance.title = 'Edit Product';
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(h2.textContent?.trim()).toBe('Edit Product');
  });

  it('should emit closed when close() is called directly', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');
    fixture.componentInstance.close();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit closed when the backdrop is clicked', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');
    const backdrop = fixture.nativeElement.querySelector('.absolute') as HTMLElement;
    backdrop.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit closed when the X button is clicked', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    closeBtn.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  describe('sizeClass getter', () => {
    it('should return max-w-md for sm', () => {
      const fixture = TestBed.createComponent(ModalComponent);
      fixture.componentInstance.size = 'sm';
      expect(fixture.componentInstance.sizeClass).toBe('max-w-md');
    });

    it('should return max-w-lg for md', () => {
      const fixture = TestBed.createComponent(ModalComponent);
      fixture.componentInstance.size = 'md';
      expect(fixture.componentInstance.sizeClass).toBe('max-w-lg');
    });

    it('should return max-w-2xl for lg', () => {
      const fixture = TestBed.createComponent(ModalComponent);
      fixture.componentInstance.size = 'lg';
      expect(fixture.componentInstance.sizeClass).toBe('max-w-2xl');
    });
  });

  it('should apply sizeClass to the modal panel', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.componentInstance.size = 'lg';
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.relative.bg-white') as HTMLElement;
    expect(panel.className).toContain('max-w-2xl');
  });

  it('should not emit closed when modal is closed and X button does not exist', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentInstance.isOpen = false;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeNull();
  });
});
