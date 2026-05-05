import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { UserModalComponent } from '../user-modal/user-modal';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ConfirmDialogComponent, UserModalComponent],
  templateUrl: './users-list.html',
})
export class UsersListComponent implements OnInit {
  users = signal<User[]>([]);
  filtered = signal<User[]>([]);
  loading = signal(false);
  error = signal('');
  search = signal('');

  showModal = signal(false);
  showConfirm = signal(false);
  confirmAction = signal<'promote' | 'demote'>('promote');
  selectedUser = signal<User | null>(null);
  modalMode = signal<'view' | 'edit'>('view');

  constructor(
    private usersService: UsersService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.filtered.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    const term = this.search().toLowerCase();
    this.filtered.set(
      this.users().filter(u =>
        u.email.toLowerCase().includes(term) ||
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term)
      )
    );
  }

  clearSearch(): void {
    this.search.set('');
    this.filtered.set(this.users());
  }

  openView(user: User): void {
    this.selectedUser.set(user);
    this.modalMode.set('view');
    this.showModal.set(true);
  }

  openEdit(user: User): void {
    this.selectedUser.set(user);
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  openPromote(user: User): void {
    this.selectedUser.set(user);
    this.confirmAction.set('promote');
    this.showConfirm.set(true);
  }

  openDemote(user: User): void {
    this.selectedUser.set(user);
    this.confirmAction.set('demote');
    this.showConfirm.set(true);
  }

  confirmRoleAction(): void {
    const user = this.selectedUser();
    if (!user) return;
    const isPromote = this.confirmAction() === 'promote';
    const request$ = isPromote
      ? this.usersService.assignRole(user.id, { role: 'ADMIN' })
      : this.usersService.removeRole(user.id, { role: 'ADMIN' });

    request$.subscribe({
      next: () => {
        this.showConfirm.set(false);
        this.loadUsers();
      },
      error: () => this.error.set('Role update failed'),
    });
  }

  isAdmin(user: User): boolean {
    return user.roles?.some(r => r.name === 'ADMIN') ?? false;
  }

  isCurrentUser(user: User): boolean {
    return user.id === this.auth.currentUser()?.id;
  }

  onModalSaved(): void {
    this.showModal.set(false);
    this.loadUsers();
  }
}