import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const unauthGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.user();
  const roles = user?.roles as unknown as string[];
  const hasRights = roles?.includes('admin') || roles?.includes('staff');
  if (hasRights && !authStore.isLoading()) return router.parseUrl('/');
  return true;
};
