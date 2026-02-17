import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, exhaustMap, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { SubprogramDto } from '../dto/subprograms/subprogram.dto';
import { ISubprogram } from '@shared/models';

interface IProgramsStore {
  isLoading: boolean;
  subprograms: ISubprogram[];
}

export const SubprogramsStore = signalStore(
  withState<IProgramsStore>({ isLoading: false, subprograms: [] }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.get<{ data: ISubprogram[] }>(`subprograms/program/${id}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, subprograms: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, subprograms: [] });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: SubprogramDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) => {
          return _http.post<{ data: ISubprogram }>('subprograms', payload).pipe(
            map(({ data }) => {
              const list = store.subprograms();
              patchState(store, { subprograms: [data, ...list] });
              _toast.showSuccess('Sous programme ajouté');
              patchState(store, { isLoading: false });
              onSuccess();
            }),
            catchError(() => {
              _toast.showError("Échec de l'ajout du sous programme");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    update: rxMethod<{ payload: SubprogramDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _http.patch<{ data: ISubprogram }>(`subprograms/${payload.id}`, payload).pipe(
            map(({ data }) => {
              const list = store.subprograms();
              const updated = list.map((sp) => (sp.id === data.id ? data : sp));
              patchState(store, { subprograms: updated });
              _toast.showSuccess('Sous programme mis à jour');
              patchState(store, { isLoading: false });
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
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.delete<void>(`subprograms/${id}`).pipe(
            map(() => {
              const list = store.subprograms();
              const filtered = list.filter((subprogram) => subprogram.id !== id);
              patchState(store, { subprograms: filtered, isLoading: false });
              _toast.showSuccess('Programme supprimé');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError('Échec de la suppression');
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
          _http.patch<{ data: ISubprogram }>(`subprograms/${id}/publish`, {}).pipe(
            map(({ data }) => {
              const list = store.subprograms();
              const updated = list.map((sp) => (sp.id === data.id ? data : sp));
              patchState(store, { subprograms: updated, isLoading: false });
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
          _http.patch<{ data: ISubprogram }>(`subprograms/${id}/highlight`, {}).pipe(
            map(({ data }) => {
              const list = store.subprograms();
              const updated = list.map((sp) => (sp.id === data.id ? data : sp));
              patchState(store, { subprograms: updated });
              _toast.showSuccess(
                data.is_highlighted ? 'Programme mis en avant' : 'Programme retiré de la mise en avant'
              );
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la mise en avant du programme');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    loadUnpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() =>
          _http.get<{ data: ISubprogram[] }>(`subprograms`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, subprograms: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, subprograms: [] });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
