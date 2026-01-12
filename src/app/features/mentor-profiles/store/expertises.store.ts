import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { buildQueryParams } from '@shared/helpers';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { IExpertise } from '@shared/models';
import { FilterExpertisesDto } from '../dto/expertises/filter-expertises.dto';
import { ExpertiseDto } from '../dto/expertises/expertise.dto';

interface IExpertisesStore {
  isLoading: boolean;
  expertises: [IExpertise[], number];
  allExpertises: IExpertise[];
}

export const ExpertisesStore = signalStore(
  withState<IExpertisesStore>({
    isLoading: false,
    expertises: [[], 0],
    allExpertises: []
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<FilterExpertisesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IExpertise[], number] }>('expertises/filtered', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, expertises: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, expertises: [[], 0] });
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
          _http.get<{ data: IExpertise[] }>('expertises').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, allExpertises: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, allExpertises: [] });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: ExpertiseDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _http.post<{ data: IExpertise }>('expertises', payload).pipe(
            map(({ data }) => {
              const [list, count] = store.expertises();
              patchState(store, { isLoading: false, expertises: [[data, ...list], count + 1] });
              _toast.showSuccess('Expertise ajoutée avec succès');
              onSuccess();
            }),
            catchError(() => {
              _toast.showError("Échec de l'ajout de l'expertise");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: ExpertiseDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _http.patch<{ data: IExpertise }>(`expertises/${id}`, payload).pipe(
            map(({ data }) => {
              _toast.showSuccess('Expertise mise à jour');
              const [list, count] = store.expertises();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              patchState(store, { isLoading: false, expertises: [updated, count] });
              onSuccess();
            }),
            catchError(() => {
              _toast.showError('Échec de la mise à jour');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    delete: rxMethod<{ id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id }) =>
          _http.delete<void>(`expertises/${id}`).pipe(
            map(() => {
              const [list, count] = store.expertises();
              const filtered = list.filter((e) => e.id !== id);
              patchState(store, { expertises: [filtered, Math.max(0, count - 1)] });
              _toast.showSuccess('Expertise supprimée avec succès');
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError("Échec de la suppression de l'expertise");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
