import { Routes } from '@angular/router';

export const notFoundRoutes: Routes = [
  {
    path: '',
    title: 'Page introuvable',
    loadComponent: () => import('./pages/not-found').then((c) => c.NotFoundPage)
  }
];
