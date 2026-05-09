import { TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge';

describe('BadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should default label to empty string', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    expect(fixture.componentInstance.label).toBe('');
  });

  it('should default color to blue', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    expect(fixture.componentInstance.color).toBe('blue');
  });

  it('should render the label text', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.componentInstance.label = 'Active';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.textContent?.trim()).toBe('Active');
  });

  it('should render empty when label is not set', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.textContent?.trim()).toBe('');
  });

  describe('colorClass getter', () => {
    it('should return green classes for green', () => {
      const fixture = TestBed.createComponent(BadgeComponent);
      fixture.componentInstance.color = 'green';
      expect(fixture.componentInstance.colorClass).toBe('bg-green-100 text-green-800');
    });

    it('should return red classes for red', () => {
      const fixture = TestBed.createComponent(BadgeComponent);
      fixture.componentInstance.color = 'red';
      expect(fixture.componentInstance.colorClass).toBe('bg-red-100 text-red-800');
    });

    it('should return blue classes for blue', () => {
      const fixture = TestBed.createComponent(BadgeComponent);
      fixture.componentInstance.color = 'blue';
      expect(fixture.componentInstance.colorClass).toBe('bg-blue-100 text-blue-800');
    });

    it('should return yellow classes for yellow', () => {
      const fixture = TestBed.createComponent(BadgeComponent);
      fixture.componentInstance.color = 'yellow';
      expect(fixture.componentInstance.colorClass).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return gray classes for gray', () => {
      const fixture = TestBed.createComponent(BadgeComponent);
      fixture.componentInstance.color = 'gray';
      expect(fixture.componentInstance.colorClass).toBe('bg-gray-100 text-gray-800');
    });
  });

  it('should apply the correct color class to the span element', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.componentInstance.color = 'red';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.className).toContain('bg-red-100');
    expect(span.className).toContain('text-red-800');
  });

  it('should always include base CSS classes on the span', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(span.className).toContain('rounded-full');
    expect(span.className).toContain('text-xs');
    expect(span.className).toContain('font-medium');
  });
});
