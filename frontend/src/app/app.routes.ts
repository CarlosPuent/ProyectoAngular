import { Routes } from '@angular/router';

import {
  authGuard,
  publicGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [

  // =====================================================
  // PUBLIC ROUTES
  // =====================================================

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  {
    path: 'login',

    canActivate: [publicGuard],

    loadComponent: () =>
      import('./features/auth/login/login')
        .then((m) => m.LoginComponent),
  },

  {
    path: 'register',

    canActivate: [publicGuard],

    loadComponent: () =>
      import('./features/auth/register/register')
        .then((m) => m.RegisterComponent),
  },

  // =====================================================
  // PROTECTED ROUTES
  // Explain:
  // - authGuard
  // - protected pages
  // - standalone layout
  // =====================================================

  {
    path: '',

    canActivate: [authGuard],

    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout')
        .then((m) => m.MainLayoutComponent),

    children: [

      {
        path: 'dashboard',

        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then((m) => m.DashboardComponent),
      },

      {
        path: 'products',

        loadComponent: () =>
          import('./features/products/products-list/products-list')
            .then((m) => m.ProductsListComponent),
      },

      // =====================================================
      // CATEGORIES ROUTE
      // Explain:
      // - Angular Routing
      // - Lazy Loading
      // - loadComponent()
      // - Standalone Components
      // =====================================================

      /*
      {
        path: 'categories',

        loadComponent: () =>
          import('./features/categories/categories-list/categories-list')
            .then((m) => m.CategoriesListComponent),
      },
      */

      {
        path: 'users',

        loadComponent: () =>
          import('./features/users/users-list/users-list')
            .then((m) => m.UsersListComponent),
      },
    ],
  },

  // =====================================================
  // FALLBACK ROUTE
  // =====================================================

  {
    path: '**',
    redirectTo: 'dashboard',
  },
];