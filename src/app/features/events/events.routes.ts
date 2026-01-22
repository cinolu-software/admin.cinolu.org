import { Routes } from '@angular/router';

export const eventsRoutes: Routes = [
  {
    path: 'events',
    children: [
      {
        path: '',
        title: 'Liste des événements',
        loadComponent: () => import('./pages/list-events/list-events').then((c) => c.ListEvents)
      },
      {
        path: 'add',
        title: 'Créer un événement',
        loadComponent: () => import('./pages/add-event/add-event').then((c) => c.AddEventComponent)
      },
      {
        path: ':slug',
        title: "Détails de l'événement",
        loadComponent: () => import('./pages/event-details/event-details').then((c) => c.EventDetails)
      }
    ]
  },
  {
    path: 'event-categories',
    title: "Catégories d'événements",
    loadComponent: () => import('./pages/event-categories/event-categories').then((c) => c.EventCategories)
  }
];
