import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { IPhase } from '@shared/models';
import { PhaseDto } from '../dto/phases/phase.dto';
import { HttpClient } from '@angular/common/http';

interface IPhasesStore {
  isLoading: boolean;
  phases: IPhase[];
  phase: IPhase | null;
}

export const PhasesStore = signalStore(
  withState<IPhasesStore>({
    isLoading: false,
    phases: [],
    phase: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadByProject: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((projectId) => {
          return _http.get<{ data: IPhase[] }>(`phases/${projectId}`).pipe(
            tap(({ data }) => patchState(store, { isLoading: false, phases: data })),
            catchError(() => {
              patchState(store, { isLoading: false, phases: [] });
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
          _http.get<{ data: IPhase }>(`phases/${slug}`).pipe(
            tap(({ data }) => patchState(store, { isLoading: false, phase: data })),
            catchError(() => {
              patchState(store, { isLoading: false, phase: null });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<PhaseDto & { id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((dto) => {
          const { id, ...body } = dto;
          return _http.post<{ data: IPhase }>(`phases/${id}`, body).pipe(
            map(({ data }) => {
              _toast.showSuccess('La phase a été créée avec succès');
              const phases = [...store.phases(), data];
              patchState(store, { isLoading: false, phases, phase: data });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la création de la phase");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    update: rxMethod<PhaseDto & { id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((dto) => {
          const { id, ...body } = dto;
          return _http.patch<{ data: IPhase }>(`phases/${id}`, body).pipe(
            map(({ data }) => {
              _toast.showSuccess('La phase a été mise à jour avec succès');
              const phases = store.phases().map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, phases });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la mise à jour");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.delete<void>(`phases/${id}`).pipe(
            tap(() => {
              _toast.showSuccess('La phase a été supprimée avec succès');
              const phases = store.phases().filter((p) => p.id !== id);
              patchState(store, { isLoading: false, phases, phase: null });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la suppression");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
