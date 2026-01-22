import { Routes } from '@angular/router';

export const mentorsRoutes: Routes = [
  {
    path: 'mentors',
    children: [
      {
        path: '',
        title: 'Liste des profils mentors',
        loadComponent: () => import('./pages/list-mentors/list-mentors').then((c) => c.ListMentors)
      },
      {
        path: ':id',
        title: 'Détails du mentor',
        loadComponent: () => import('./pages/mentor-details/mentor-details').then((c) => c.MentorDetails)
      }
    ]
  },
  {
    path: 'expertises',
    title: 'Expertises',
    loadComponent: () => import('./pages/mentor-expertises/mentor-expertises').then((c) => c.MentorExpertises)
  }
];
