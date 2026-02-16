import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { buildQueryParams } from '@shared/helpers';
import { IEvent } from '@shared/models';
import { FilterEventCategoriesDto } from '../dto/categories/filter-categories.dto';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { EventDto } from '../dto/events/event.dto';

interface IEventsStore {
  isLoading: boolean;
  events: [IEvent[], number];
  event: IEvent | null;
}

export const EventsStore = signalStore(
  withState<IEventsStore>({
    isLoading: false,
    events: [[], 0],
    event: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _router: inject(Router),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _router, _toast, ...store }) => ({
    loadAll: rxMethod<FilterEventCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IEvent[], number] }>('events', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, events: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, events: [[], 0] });
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
          _http.get<{ data: IEvent }>(`events/by-slug/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, event: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<EventDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.post<{ data: IEvent }>('events', payload).pipe(
            map(({ data }) => {
              _toast.showSuccess("L'événement a été ajouté avec succès");
              _router.navigate(['/events']);
              patchState(store, { isLoading: false, event: data });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<EventDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.patch<{ data: IEvent }>(`events/${payload.id}`, payload).pipe(
            map(({ data }) => {
              _toast.showSuccess("L'événement a été mis à jour avec succès");
              _router.navigate(['/events']);
              const [list, count] = store.events();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              patchState(store, { isLoading: false, event: data, events: [updated, count] });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la mise à jour");
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
        switchMap((id) =>
          _http.delete<void>(`events/${id}`).pipe(
            map(() => {
              const [list, count] = store.events();
              const filtered = list.filter((e) => e.id !== id);
              _toast.showSuccess("L'événement a été supprimé avec succès");
              patchState(store, { isLoading: false, events: [filtered, Math.max(0, count - 1)] });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la suppression");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IEvent }>(`events/${id}/publish`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.events();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              patchState(store, { isLoading: false, events: [updated, count], event: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IEvent }>(`events/${id}/highlight`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.events();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              _toast.showSuccess(
                data.is_highlighted ? 'Evénement mis en avant' : 'Evénement retiré des mises en avant'
              );
              patchState(store, { isLoading: false, events: [updated, count], event: data });
            }),
            catchError(() => {
              _toast.showError("Erreur lors de la mise en avant de l'Evénement");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
