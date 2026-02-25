import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { buildQueryParams } from '@shared/helpers';
import { IMentorProfile } from '@shared/models';
import { FilterMentorsProfileDto } from '../dto/mentors/filter-mentors-profiles.dto';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { Router } from '@angular/router';
import { CreateMentorDto } from '../dto/mentors/create-mentor.dto';

interface IMentorsStore {
  isLoading: boolean;
  isSaving: boolean;
  isSearchingUsers: boolean;
  userSearchTerm: string;
  searchedUsers: { email: string; name: string }[];
  mentors: [IMentorProfile[], number];
  mentor: IMentorProfile | null;
}

export const MentorsStore = signalStore(
  withState<IMentorsStore>({
    isLoading: false,
    isSaving: false,
    isSearchingUsers: false,
    userSearchTerm: '',
    searchedUsers: [],
    mentors: [[], 0],
    mentor: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService),
    _router: inject(Router)
  })),
  withComputed(({ searchedUsers }) => ({
    userSearchOptions: computed(() =>
      searchedUsers().map((user) => ({ label: `${user.name} (${user.email})`, value: user.email }))
    )
  })),
  withMethods(({ _http, _toast, _router, ...store }) => ({
    loadAll: rxMethod<FilterMentorsProfileDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IMentorProfile[], number] }>('mentors/paginated', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, mentors: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, mentors: [[], 0] });
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
          _http.get<{ data: IMentorProfile }>(`mentors/${id}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, mentor: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    searchUsers: rxMethod<string>(
      pipe(
        map((term) => term.trim()),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((term) => {
          patchState(store, { userSearchTerm: term });
          if (term.length < 2) {
            patchState(store, { isSearchingUsers: false });
            return of(null);
          }

          patchState(store, { isSearchingUsers: true });
          return _http.get<{ data: { email: string; name: string }[] }>('users/search', { params: { term } }).pipe(
            map(({ data }) => {
              patchState(store, { isSearchingUsers: false, searchedUsers: Array.isArray(data) ? data : [] });
            }),
            catchError(() => {
              patchState(store, { isSearchingUsers: false, searchedUsers: [] });
              return of(null);
            })
          );
        })
      )
    ),
    approve: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IMentorProfile }>(`mentors/${id}/approve`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.mentors();
              const updated = list.map((m) => (m.id === data.id ? data : m));
              _toast.showSuccess('Profil mentor approuvé');
              patchState(store, { isLoading: false, mentors: [updated, count], mentor: data });
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
          _http.patch<{ data: IMentorProfile }>(`mentors/${id}/reject`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.mentors();
              const updated = list.map((m) => (m.id === data.id ? data : m));
              _toast.showSuccess('Profil mentor rejeté');
              patchState(store, { isLoading: false, mentors: [updated, count], mentor: data });
            }),
            catchError(() => {
              _toast.showError('Erreur lors du rejet');
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<CreateMentorDto>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap((dto) =>
          _http.post<{ data: IMentorProfile }>('mentors', dto).pipe(
            map(({ data }) => {
              _toast.showSuccess('Mentor créé avec succès');
              patchState(store, { isSaving: false, mentor: data });
              _router.navigate(['/mentors']);
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la création du mentor');
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; dto: CreateMentorDto }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ id, dto }) =>
          _http.patch<{ data: IMentorProfile }>(`mentors/${id}`, dto).pipe(
            map(({ data }) => {
              const [list, count] = store.mentors();
              const updated = list.map((mentor) => (mentor.id === data.id ? data : mentor));
              _toast.showSuccess('Mentor mis à jour avec succès');
              patchState(store, { isSaving: false, mentors: [updated, count], mentor: data });
              _router.navigate(['/mentors']);
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la mise à jour du mentor');
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    patch: rxMethod<{ id: string; dto: CreateMentorDto }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ id, dto }) =>
          _http.patch<{ data: IMentorProfile }>(`mentors/${id}`, dto).pipe(
            map(({ data }) => {
              const [list, count] = store.mentors();
              const updated = list.map((mentor) => (mentor.id === data.id ? data : mentor));
              _toast.showSuccess('Mentor mis à jour avec succès');
              patchState(store, { isSaving: false, mentors: [updated, count], mentor: data });
              _router.navigate(['/mentors']);
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la mise à jour du mentor');
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
