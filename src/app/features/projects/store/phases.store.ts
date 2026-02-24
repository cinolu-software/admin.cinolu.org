import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { IMentorProfile, IPhase } from '@shared/models';
import { PhaseDto } from '../dto/phases/phase.dto';
import { MoveParticipationsDto } from '../dto/phases/move-participations.dto';
import { HttpClient } from '@angular/common/http';
import { parseDate } from '@shared/helpers';

interface IPhasesStore {
  isLoading: boolean;
  isMentorsLoading: boolean;
  phases: IPhase[];
  phase: IPhase | null;
  mentors: IMentorProfile[];
}

export const PhasesStore = signalStore(
  withState<IPhasesStore>({
    isLoading: false,
    isMentorsLoading: false,
    phases: [],
    phase: null,
    mentors: []
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withComputed(({ phases }) => ({
    sortedPhases: computed(() =>
      phases().sort((a, b) => parseDate(a.started_at).getTime() - parseDate(b.started_at).getTime())
    )
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return _http.get<{ data: IPhase[] }>(`phases/project/${id}`).pipe(
            tap(({ data }) => patchState(store, { isLoading: false, phases: data })),
            catchError(() => {
              patchState(store, { isLoading: false, phases: [] });
              return of(null);
            })
          );
        })
      )
    ),
    loadMentors: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isMentorsLoading: true })),
        switchMap(() =>
          _http.get<{ data: IMentorProfile[] }>('mentors').pipe(
            map(({ data }) => {
              patchState(store, { isMentorsLoading: false, mentors: data });
            }),
            catchError(() => {
              patchState(store, { isMentorsLoading: false, mentors: [] });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<{ projectId: string; dto: PhaseDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ dto, projectId, onSuccess }) => {
          delete dto?.id;
          return _http.post<{ data: IPhase }>(`phases/${projectId}`, dto).pipe(
            map(({ data }) => {
              _toast.showSuccess('La phase a été créée avec succès');
              const phases = [...store.phases(), data];
              patchState(store, { isLoading: false, phases, phase: data });
              onSuccess();
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
    update: rxMethod<{ dto: PhaseDto & { id: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ dto, onSuccess }) => {
          return _http.patch<{ data: IPhase }>(`phases/${dto.id}`, dto).pipe(
            map(({ data }) => {
              _toast.showSuccess('La phase a été mise à jour avec succès');
              const phases = store.phases().map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, phases });
              onSuccess();
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
    ),
    moveParticipations: rxMethod<{ dto: MoveParticipationsDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ dto, onSuccess }) =>
          _http.post<void>('phases/participants/move', dto).pipe(
            map(() => {
              _toast.showSuccess('Les participants ont été déplacés avec succès');
              patchState(store, { isLoading: false });
              onSuccess();
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors du déplacement des participants");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    removeParticipations: rxMethod<{ dto: MoveParticipationsDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ dto, onSuccess }) =>
          _http.post<void>('phases/participants/remove', dto).pipe(
            map(() => {
              _toast.showSuccess('Les participants ont été retirés avec succès');
              patchState(store, { isLoading: false });
              onSuccess();
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors du retrait des participants");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
