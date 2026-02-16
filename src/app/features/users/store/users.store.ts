import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterUsersDto } from '../dto/users/filter-users.dto';
import { buildQueryParams } from '@shared/helpers';
import { IUser } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { Router } from '@angular/router';
import { UserDto } from '../dto/users/user.dto';

interface IUsersStore {
  isLoading: boolean;
  users: [IUser[], number];
  user: IUser | null;
  staff: IUser[];
}

export const UsersStore = signalStore(
  withState<IUsersStore>({ isLoading: false, users: [[], 0], user: null, staff: [] }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService),
    _router: inject(Router)
  })),
  withMethods(({ _http, _toast, _router, ...store }) => ({
    loadAll: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IUser[], number] }>('users', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, users: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, users: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadStaff: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true } as Partial<IUsersStore>)),
        switchMap(() =>
          _http.get<{ data: IUser[] }>('users/staff').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, staff: data } as Partial<IUsersStore>);
            }),
            catchError(() => {
              patchState(store, { isLoading: false, staff: [] } as Partial<IUsersStore>);
              return of(null);
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((email) =>
          _http.get<{ data: IUser }>(`users/${email}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, user: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, user: null });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<UserDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((dto) =>
          _http.post<{ data: IUser }>('users', dto).pipe(
            map(({ data }) => {
              _router.navigate(['/users']);
              _toast.showSuccess('Utilisateur ajouté avec succès');
              patchState(store, { isLoading: false, user: data });
            }),
            catchError(() => {
              _toast.showError("Erreur lors de l'ajout de l'utilisateur");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<UserDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((userData) =>
          _http.patch<{ data: IUser }>(`users/${userData.id}`, userData).pipe(
            map(({ data }) => {
              _router.navigate(['/users']);
              _toast.showSuccess('Utilisateur mis à jour avec succès');
              patchState(store, { isLoading: false, user: data });
            }),
            catchError(() => {
              _toast.showError("Erreur lors de la mise à jour de l'utilisateur");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((userId) =>
          _http.delete<void>(`users/${userId}`).pipe(
            map(() => {
              const [list, count] = store.users();
              const filtered = list.filter((u) => u.id !== userId);
              patchState(store, { isLoading: false, users: [filtered, Math.max(0, count - 1)] });
              _toast.showSuccess('Utilisateur supprimé avec succès');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError("Échec de la suppression de l'utilisateur");
              return of(null);
            })
          )
        )
      )
    ),
    download: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get('users/export/users.csv', { params, responseType: 'blob' }).pipe(
            tap((blob) => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'users.csv';
              a.click();
              window.URL.revokeObjectURL(url);
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    )
  }))
);
