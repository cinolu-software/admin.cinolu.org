import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { buildQueryParams } from '@shared/helpers';
import { IMentorProfile } from '@shared/models';
import { FilterMentorsProfileDto } from '../dto/mentors/filter-mentors-profiles.dto';
import { ToastrService } from '@shared/services/toast/toastr.service';

interface IMentorProfilesStore {
  isLoading: boolean;
  mentorProfiles: [IMentorProfile[], number];
  mentorProfile: IMentorProfile | null;
}

export const MentorProfilesStore = signalStore(
  withState<IMentorProfilesStore>({
    isLoading: false,
    mentorProfiles: [[], 0],
    mentorProfile: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _router: inject(Router),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _router, _toast, ...store }) => ({
    loadAll: rxMethod<FilterMentorsProfileDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IMentorProfile[], number] }>('mentor-profiles/filtered', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, mentorProfiles: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, mentorProfiles: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.get<{ data: IMentorProfile }>(`mentor-profiles/${id}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, mentorProfile: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    approve: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IMentorProfile }>(`mentor-profiles/approve/${id}`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.mentorProfiles();
              const updated = list.map((m) => (m.id === data.id ? data : m));
              _toast.showSuccess('Profil mentor approuvé');
              patchState(store, { isLoading: false, mentorProfiles: [updated, count], mentorProfile: data });
            }),
            catchError(() => {
              _toast.showError("Erreur lors de l'approbation");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    reject: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IMentorProfile }>(`mentor-profiles/reject/${id}`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.mentorProfiles();
              const updated = list.map((m) => (m.id === data.id ? data : m));
              _toast.showSuccess('Profil mentor rejeté');
              patchState(store, { isLoading: false, mentorProfiles: [updated, count], mentorProfile: data });
            }),
            catchError(() => {
              _toast.showError('Erreur lors du rejet');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
