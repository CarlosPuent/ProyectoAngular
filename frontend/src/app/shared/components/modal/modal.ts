import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  get sizeClass(): string {
    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
    return sizes[this.size];
  }
}