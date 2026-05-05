import { Component, Input, Output, EventEmitter, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user.model';
import { ModalComponent } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './user-modal.html',
})
export class UserModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  get title(): string {
    return this.mode === 'view' ? 'User Details' : 'Edit User';
  }

  ngOnChanges(): void {}
}