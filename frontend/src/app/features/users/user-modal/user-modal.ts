import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user.model';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, BadgeComponent],
  templateUrl: './user-modal.html',
})
export class UserModalComponent {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  get title(): string {
    return this.mode === 'view' ? 'User Details' : 'Edit User';
  }
}