import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.user();
  const roles = user?.roles;
  const hasRights = roles?.some((r) => r.name === 'admin' || r.name === 'staff');
  if (!authStore.isLoading() && !hasRights) return router.parseUrl('/sign-in');
  return true;
};
