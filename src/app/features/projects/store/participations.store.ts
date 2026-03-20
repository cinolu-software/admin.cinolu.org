import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IProjectParticipation } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterParticipationsDto } from '../dto/phases/filter-participations.dto';
import { MoveParticipationsDto } from '../dto/phases/move-participations.dto';

interface ParticipationsStoreState {
  isLoading: boolean;
  isSaving: boolean;
  participations: [IProjectParticipation[], number];
}

export const ParticipationsStore = signalStore(
  withState<ParticipationsStoreState>({ isLoading: false, isSaving: false, participations: [[], 0] }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withComputed(({ participations }) => ({
    list: computed(() => participations()[0]),
    total: computed(() => participations()[1])
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<{ projectId: string; filters: FilterParticipationsDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ projectId, filters }) => {
          const params = buildQueryParams(filters);
          return _http
            .get<{ data: [IProjectParticipation[], number] }>(`projects/id/${projectId}/participations`, { params })
            .pipe(
              map(({ data }) => {
                patchState(store, { isLoading: false, participations: data });
              }),
              catchError(() => {
                patchState(store, { isLoading: false, participations: [[], 0] });
                return of(null);
              })
            );
        })
      )
    ),
    moveToPhase: rxMethod<MoveParticipationsDto & { onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ onSuccess, ...dto }) =>
          _http.post<void>('projects/participants/move', dto).pipe(
            tap(() => {
              patchState(store, { isSaving: false });
              _toast.showSuccess('Les participants ont été ajoutés à la phase');
              onSuccess?.();
            }),
            catchError((error) => {
              _toast.showError(extractApiErrorMessage(error, "Une erreur s'est produite lors du déplacement des participants"));
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    removeFromPhase: rxMethod<MoveParticipationsDto & { onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ onSuccess, ...dto }) =>
          _http.post<void>('projects/participants/remove', dto).pipe(
            tap(() => {
              patchState(store, { isSaving: false });
              _toast.showSuccess('Les participants ont été retirés de la phase');
              onSuccess?.();
            }),
            catchError((error) => {
              _toast.showError(extractApiErrorMessage(error, "Une erreur s'est produite lors du retrait des participants"));
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
