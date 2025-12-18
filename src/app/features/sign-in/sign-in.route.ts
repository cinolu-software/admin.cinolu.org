import { Routes } from '@angular/router';
import { unauthGuard } from '@core/guards';

export const signInRoutes: Routes = [
  {
    path: '',
    title: 'Connexion',
    canActivate: [unauthGuard],
    loadComponent: () => import('./pages/sign-in').then((c) => c.SignIn)
  }
];
