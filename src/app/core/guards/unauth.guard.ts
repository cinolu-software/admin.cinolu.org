import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const unauthGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.user();
  const roles = user?.roles;
  const hasRights = roles?.some((r) => r.name === 'admin' || r.name === 'staff');
  if (hasRights && !authStore.isLoading()) return router.parseUrl('/');
  return true;
};
