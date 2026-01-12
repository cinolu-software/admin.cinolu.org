import { Routes } from '@angular/router';

export const mentorsRoutes: Routes = [
  {
    path: 'mentor-profiles',
    children: [
      {
        path: '',
        title: 'Liste des profils mentors',
        loadComponent: () =>
          import('./pages/list-mentor-profiles/list-mentor-profiles').then((c) => c.ListMentorProfiles)
      },
      {
        path: 'view/:id',
        title: 'Profil mentor',
        loadComponent: () => import('./pages/view-mentor-profile/view-mentor-profile').then((c) => c.ViewMentorProfile)
      }
    ]
  },
  {
    path: 'expertises',
    title: 'Expertises',
    loadComponent: () => import('./pages/expertises/expertises').then((c) => c.Expertises)
  }
];
