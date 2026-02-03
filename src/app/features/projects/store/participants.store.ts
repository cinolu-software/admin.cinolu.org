import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ParticipantsGroupedByPhaseDto as ParticipantsByPhaseDto } from '../dto/participants/participants.dto';

interface IParticipantsStore {
  isLoading: boolean;
  data: ParticipantsByPhaseDto | null;
}

export const ParticipantsStore = signalStore(
  withState<IParticipantsStore>({
    isLoading: false,
    data: null
  }),
  withProps(() => ({
    _http: inject(HttpClient)
  })),
  withMethods(({ _http, ...store }) => ({
    load: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((projectId) =>
          _http.get<{ data: ParticipantsByPhaseDto }>(`projects/${projectId}/participants/grouped-by-phase`).pipe(
            tap(({ data }) => patchState(store, { isLoading: false, data })),
            catchError(() => {
              patchState(store, { isLoading: false, data: null });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
