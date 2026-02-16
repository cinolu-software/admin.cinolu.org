import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { buildQueryParams } from '@shared/helpers';
import { IVenture } from '@shared/models';
import { FilterVenturesDto } from '../dto/filter-ventures.dto';
import { ToastrService } from '@shared/services/toast/toastr.service';

interface IVenturesStore {
  isLoading: boolean;
  ventures: [IVenture[], number];
  venture: IVenture | null;
}

export const VenturesStore = signalStore(
  withState<IVenturesStore>({
    isLoading: false,
    ventures: [[], 0],
    venture: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<FilterVenturesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IVenture[], number] }>('ventures', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, ventures: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, ventures: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _http.get<{ data: IVenture }>(`ventures/by-slug/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, venture: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    togglePublish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _http.patch<{ data: IVenture }>(`ventures/by-slug/${slug}/publish`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.ventures();
              const updated = list.map((v) => (v.slug === data.slug ? data : v));
              _toast.showSuccess(
                data.is_published ? 'Venture publiée avec succès' : 'Venture dépubliée avec succès'
              );
              patchState(store, { isLoading: false, ventures: [updated, count], venture: data });
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la modification du statut de publication');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
