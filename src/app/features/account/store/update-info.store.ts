import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UpdateInfoDto } from '../dto/update-info.dto';
import { AuthStore } from '@core/auth/auth.store';
import { IUser } from '@shared/models/user.model';
import { ToastrService } from '@shared/services/toast';

interface IUpdateInfoStore {
  isLoading: boolean;
}

export const UpdateInfoStore = signalStore(
  withState<IUpdateInfoStore>({ isLoading: false }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService),
    _authStore: inject(AuthStore)
  })),
  withMethods(({ _http, _toast, _authStore, ...store }) => ({
    updateInfo: rxMethod<UpdateInfoDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) => {
          return _http.patch<{ data: IUser }>('auth/me', payload).pipe(
            tap(({ data }) => {
              patchState(store, { isLoading: false });
              _toast.showSuccess('Profil mis à jour');
              _authStore.setUser(data);
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError('Erreur lors de la mise à jour');
              return of(null);
            })
          );
        })
      )
    )
  }))
);
