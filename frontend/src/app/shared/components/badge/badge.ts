import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="colorClass + ' px-2.5 py-0.5 rounded-full text-xs font-medium'">
      {{ label }}
    </span>
  `,
})
export class BadgeComponent {
  @Input() label = '';
  @Input() color: 'green' | 'red' | 'blue' | 'yellow' | 'gray' = 'blue';

  get colorClass(): string {
    const colors = {
      green:  'bg-green-100 text-green-800',
      red:    'bg-red-100 text-red-800',
      blue:   'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray:   'bg-gray-100 text-gray-800',
    };
    return colors[this.color];
  }
}