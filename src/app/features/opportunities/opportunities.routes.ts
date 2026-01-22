import { Routes } from '@angular/router';

export const opportunitiesRoutes: Routes = [
  {
    path: 'opportunities',
    title: 'Les opportunités',
    children: [
      {
        path: '',
        title: 'Liste des opportunités',
        loadComponent: () => import('./pages/list-opportunities/list-opportunities').then((c) => c.ListOpportunities)
      },
      {
        path: 'add',
        title: 'Créer une opportunité',
        loadComponent: () => import('./pages/add-opportunity/add-opportunity').then((c) => c.AddOpportunity)
      },
      {
        path: ':id',
        title: 'Détails de l\'opportunité',
        loadComponent: () => import('./pages/opportunity-details/opportunity-details').then((c) => c.OpportunityDetails)
      }
    ]
  },
  {
    path: 'opportunity-tags',
    title: 'Tags des opportunités',
    loadComponent: () => import('./pages/opportunity-tags/opportunity-tags').then((c) => c.OpportunityTags)
  }
];
