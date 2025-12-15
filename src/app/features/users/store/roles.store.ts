import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterRolesDto } from '../dto/roles/filter-roles.dto';
import { buildQueryParams } from '@shared/helpers';
import { IRole } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { RoleDto } from '../dto/roles/role.dto';

interface IRolesStore {
  isLoading: boolean;
  roles: [IRole[], number];
  allRoles: IRole[];
}

export const RolesStore = signalStore(
  withState<IRolesStore>({ isLoading: false, roles: [[], 0], allRoles: [] }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<FilterRolesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IRole[], number] }>('roles/paginated', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, roles: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, roles: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadUnpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          _http.get<{ data: IRole[] }>('roles').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, allRoles: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, allRoles: [] });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _http.post<{ data: IRole }>('roles', payload).pipe(
            map(({ data }) => {
              const [roles, count] = store.roles();
              patchState(store, {
                isLoading: false,
                roles: [[data, ...roles], count + 1],
                allRoles: [data, ...store.allRoles()]
              });
              _toast.showSuccess('Rôle ajouté avec succès');
              onSuccess();
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError("Échec de l'ajout du rôle");
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ payload: RoleDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _http.patch<{ data: IRole }>(`roles/${payload.id}`, payload).pipe(
            map(({ data }) => {
              const [roles, count] = store.roles();
              const updated = roles.map((r) => (r.id === data.id ? data : r));
              const allUpdated = store.allRoles().map((r) => (r.id === data.id ? data : r));
              patchState(store, {
                isLoading: false,
                roles: [updated, count],
                allRoles: allUpdated
              });
              _toast.showSuccess('Rôle mis à jour avec succès');
              onSuccess();
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError('Erreur lors de la mise à jour du rôle');
              return of(null);
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.delete<void>(`roles/${id}`).pipe(
            map(() => {
              const [roles, count] = store.roles();
              const filtered = roles.filter((role) => role.id !== id);
              const allFiltered = store.allRoles().filter((r) => r.id !== id);
              patchState(store, {
                isLoading: false,
                roles: [filtered, Math.max(0, count - 1)],
                allRoles: allFiltered
              });
              _toast.showSuccess('Rôle supprimé avec succès');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError('Échec de la suppression du rôle');
              return of(null);
            })
          )
        )
      )
    )
  }))
);
