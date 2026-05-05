import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  readonly isCollapsed = signal(false);

  readonly navItems: ReadonlyArray<NavItem> = [
    { label: 'Dashboard', path: '/dashboard', adminOnly: false },
    { label: 'Products',  path: '/products',  adminOnly: false },
    { label: 'Categories',path: '/categories',adminOnly: false },
    { label: 'Users',     path: '/users',     adminOnly: true  },
  ];

  readonly visibleItems = computed<ReadonlyArray<NavItem>>(() => {
    const isAdmin = this.auth.isAdmin();
    if (isAdmin) return this.navItems;
    return this.navItems.filter((item) => !item.adminOnly);
  });

  constructor(public readonly auth: AuthService) {}

  toggleCollapse(): void {
    this.isCollapsed.update((collapsed) => !collapsed);
  }
}