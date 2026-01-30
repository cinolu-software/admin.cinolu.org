import { Routes } from '@angular/router';

export const venturesRoutes: Routes = [
  {
    path: 'ventures',
    children: [
      {
        path: '',
        title: 'Liste des ventures',
        loadComponent: () => import('./pages/list-ventures/list-ventures').then((c) => c.ListVentures)
      },
      {
        path: 'view/:slug',
        title: 'Détails du venture',
        loadComponent: () => import('./pages/venture-details/venture-details').then((c) => c.VentureDetails)
      }
    ]
  }
];
