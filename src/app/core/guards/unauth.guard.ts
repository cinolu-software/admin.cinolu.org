import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const unauthGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const hasRights = authStore.hasRights();
  const url = route.queryParamMap.get('redirect');
  if (hasRights) return router.navigate([url]);
  return true;
};
