import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: '',
    title: 'Mon compte',
    loadComponent: () => import('./pages/account/account').then((c) => c.Account)
  }
];
