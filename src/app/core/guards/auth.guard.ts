import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const authGuard: CanActivateFn = (_, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const hasRights = authStore.hasRights();
  if (!hasRights) {
    return router.navigateByUrl('/?redirect=' + state.url);
  }
  return true;
};
