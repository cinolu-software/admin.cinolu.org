import { signalStore, withState, withMethods, patchState, withProps, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, of, exhaustMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { ToastrService } from '../../shared/services/toast/toastr.service';
import { Router } from '@angular/router';
import { IUser } from '@shared/models';
import { extractApiErrorMessage } from '@shared/helpers';

interface IAuthStore {
  user: IUser | null;
  isCheckingAuth: boolean;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<IAuthStore>({ user: null, isCheckingAuth: true }),
  withProps(() => ({
    http: inject(HttpClient),
    toast: inject(ToastrService),
    router: inject(Router)
  })),
  withComputed(({ user }) => ({
    hasRights: computed(() => {
      const roles = user()?.roles as unknown as string[];
      return roles?.some((role) => role === 'admin' || role === 'staff');
    })
  })),
  withMethods(({ http, toast, router, ...store }) => ({
    getProfile: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isCheckingAuth: true })),
        exhaustMap(() =>
          http.get<{ data: IUser }>('auth/me').pipe(
            tap(({ data }) => {
              patchState(store, { user: data, isCheckingAuth: false });
            }),
            catchError(() => {
              patchState(store, { user: null, isCheckingAuth: false });
              return of(null);
            })
          )
        )
      )
    ),
    signOut: rxMethod<void>(
      pipe(
        exhaustMap(() =>
          http.post<void>('auth/signout', {}).pipe(
            tap(() => {
              router.navigate(['/']);
              patchState(store, { user: null });
              toast.showSuccess('Déconnexion réussie');
            }),
            catchError((error) => {
              toast.showError(extractApiErrorMessage(error, 'Erreur lors de la déconnexion'));
              return of(null);
            })
          )
        )
      )
    ),
    setUser: (user: IUser | null) => {
      patchState(store, { user });
    },
    setCheckingAuth: (isCheckingAuth: boolean) => {
      patchState(store, { isCheckingAuth });
    }
  }))
);
