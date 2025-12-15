import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { buildQueryParams } from '@shared/helpers';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ICategory } from '@shared/models';
import { FilterEventCategoriesDto } from '../dto/categories/filter-categories.dto';
import { EventCategoryDto } from '../dto/events/event-category.dto';

interface ICategoriesStore {
  isLoading: boolean;
  categories: [ICategory[], number];
  allCategories: ICategory[];
}

export const CategoriesStore = signalStore(
  withState<ICategoriesStore>({
    isLoading: false,
    categories: [[], 0],
    allCategories: []
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<FilterEventCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [ICategory[], number] }>('event-categories/paginated', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, categories: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, categories: [[], 0] });
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
          _http.get<{ data: ICategory[] }>('event-categories').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, allCategories: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, allCategories: [] });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: EventCategoryDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _http.post<{ data: ICategory }>('event-categories', payload).pipe(
            map(({ data }) => {
              const [list, count] = store.categories();
              patchState(store, { isLoading: false, categories: [[data, ...list], count + 1] });
              _toast.showSuccess('Catégorie ajoutée avec succès');
              onSuccess();
            }),
            catchError(() => {
              _toast.showError("Échec de l'ajout de la catégorie");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: { id: string; name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _http.patch<{ data: ICategory }>(`event-categories/${id}`, payload).pipe(
            map(({ data }) => {
              _toast.showSuccess('Catégorie mise à jour');
              const [list, count] = store.categories();
              const updated = list.map((c) => (c.id === data.id ? data : c));
              patchState(store, { isLoading: false, categories: [updated, count] });
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
          _http.delete<void>(`event-categories/${id}`).pipe(
            map(() => {
              const [list, count] = store.categories();
              const filtered = list.filter((c) => c.id !== id);
              patchState(store, { categories: [filtered, Math.max(0, count - 1)] });
              _toast.showSuccess('Catégorie supprimée avec succès');
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError('Échec de la suppression de la catégorie');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
