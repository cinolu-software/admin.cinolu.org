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
        path: 'add',
        title: 'Ajouter un mentor',
        loadComponent: () => import('./pages/add-mentor/add-mentor').then((c) => c.AddMentor)
      },
      {
        path: 'update/:id',
        title: 'Modifier le mentor',
        loadComponent: () => import('./pages/update-mentor/update-mentor').then((c) => c.UpdateMentor)
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
