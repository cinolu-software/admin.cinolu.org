import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { ToastrService } from '@shared/services/toast';
import { IUser } from '@shared/models/user.model';

interface IUpdatePasswordStore {
  isLoading: boolean;
}

export const UpdatePasswordStore = signalStore(
  withState<IUpdatePasswordStore>({ isLoading: false }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    updatePassword: rxMethod<UpdatePasswordDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) => {
          return _http.patch<{ data: IUser }>('auth/update-password', payload).pipe(
            tap(() => {
              _toast.showSuccess('Mot de passe mis à jour');
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la mise à jour');
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    )
  }))
);
