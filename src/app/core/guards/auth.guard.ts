import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const authGuard: CanActivateFn = (_, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Check if user is authenticated
  const isAuthenticated = authStore.isAuthenticated();
  const hasRights = authStore.hasRights();

  if (!isAuthenticated) {
    // Not logged in - redirect to sign-in with return URL
    return router.createUrlTree(['/'], {
      queryParams: { redirect: state.url }
    });
  }

  if (!hasRights) {
    // Logged in but no admin/staff rights - show access denied
    return router.createUrlTree(['/access-denied']);
  }

  return true;
};
