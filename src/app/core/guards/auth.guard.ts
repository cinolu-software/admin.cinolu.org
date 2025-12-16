import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.user();
  const roles = user?.roles as unknown as string[];
  const hasRights = roles?.includes('admin') || roles?.includes('staff') || false;
  if (!hasRights) return router.navigate(['/sign-in']);
  return true;
};
