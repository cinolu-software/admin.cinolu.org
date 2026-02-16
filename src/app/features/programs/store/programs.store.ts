import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterProgramsDto } from '../dto/programs/filter-programs.dto';
import { buildQueryParams } from '@shared/helpers';
import { IProgram } from '@shared/models';
import { Router } from '@angular/router';
import { ToastrService } from '@shared/services/toast';
import { ProgramDto } from '../dto/programs/program.dto';

interface IProgramsStore {
  isLoading: boolean;
  programs: [IProgram[], number];
  program: IProgram | null;
  allPrograms: IProgram[];
}

export const ProgramsStore = signalStore(
  withState<IProgramsStore>({ isLoading: false, programs: [[], 0], program: null, allPrograms: [] }),
  withProps(() => ({
    _http: inject(HttpClient),
    _router: inject(Router),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _router, _toast, ...store }) => ({
    loadAll: rxMethod<FilterProgramsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IProgram[], number] }>('programs/paginated', { params }).pipe(
            tap(({ data }) => {
              patchState(store, { isLoading: false, programs: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, programs: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadUnpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() =>
          _http.get<{ data: IProgram[] }>('programs').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, allPrograms: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, allPrograms: [] });
              return of(null);
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) => {
          return _http.get<{ data: IProgram }>(`programs/by-slug/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, program: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, program: null });
              return of(null);
            })
          );
        })
      )
    ),
    create: rxMethod<ProgramDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.post('programs', payload).pipe(
            map(() => {
              _router.navigate(['/programs']);
              _toast.showSuccess('Programme ajouté');
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError("Échec de l'ajout du rôle");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ programId: string; payload: ProgramDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ programId, payload }) =>
          _http.patch<{ data: IProgram }>(`programs/${programId}`, payload).pipe(
            map(({ data }) => {
              _toast.showSuccess('Programme mis à jour');
              _router.navigate(['/programs']);
              const [list, count] = store.programs();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, program: data, programs: [updated, count] });
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
          _http.delete<void>(`programs/${id}`).pipe(
            map(() => {
              const [programs, count] = store.programs();
              const filtered = programs.filter((program) => program.id !== id);
              _toast.showSuccess('Programme supprimé');
              patchState(store, { isLoading: false, programs: [filtered, Math.max(0, count - 1)] });
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

    // Publish / Highlight
    publishProgram: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IProgram }>(`programs/${id}/publish`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.programs();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, program: data, programs: [updated, count] });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    highlight: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IProgram }>(`programs/${id}/highlight`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.programs();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              _toast.showSuccess(
                data.is_highlighted ? 'Programme mis en avant' : 'Programme retiré de la mise en avant'
              );
              patchState(store, { isLoading: false, program: data, programs: [updated, count] });
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la mise en avant du programme');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
