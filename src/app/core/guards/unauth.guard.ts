import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const unauthGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const hasRights = authStore.hasRights();
  if (hasRights) {
    const redirectPath = route.queryParamMap.get('redirect') || '/';
    return router.navigateByUrl(redirectPath);
  }
  return true;
};
