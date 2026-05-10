import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  value: number;
  description: string;
  color: string;
  path: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  stats = signal<StatCard[]>([]);
  loading = signal(true);

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private usersService: UsersService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    const cards: StatCard[] = [
      { label: 'Total Products', value: 0, description: 'Active products in catalog', color: 'blue', path: '/products' },
      { label: 'Categories', value: 0, description: 'Product categories', color: 'purple', path: '/categories' },
      { label: 'Registered Users', value: 0, description: 'Total user accounts', color: 'green', path: '/users' },
    ];

    this.productsService.getAll({ limit: 1 }).subscribe({
      next: (res) => { cards[0].value = res.total; this.stats.set([...cards]); },
    });

    this.categoriesService.getAll().subscribe({
      next: (res) => { cards[1].value = res.length; this.stats.set([...cards]); },
    });

    if (this.auth.isAdmin()) {
      this.usersService.getAll().subscribe({
        next:  (res) => { cards[2].value = res.length; this.stats.set([...cards]); this.loading.set(false); },
        error: ()    => { this.loading.set(false); },
      });
    } else {
      cards.splice(2, 1);
      this.stats.set([...cards]);
      this.loading.set(false);
    }
  }
}