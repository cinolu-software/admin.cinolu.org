import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { IProject, ProjectParticipation } from '@shared/models';
import { buildQueryParams, parseDate } from '@shared/helpers';
import { FilterProjectCategoriesDto } from '../dto/categories/filter-categories.dto';
import { ProjectDto } from '../dto/projects/project.dto';

interface IProjectsStore {
  isLoading: boolean;
  isImportingCsv: boolean;
  isLoadingParticipations: boolean;
  projects: [IProject[], number];
  project: IProject | null;
  participations: ProjectParticipation[];
}

export const ProjectsStore = signalStore(
  withState<IProjectsStore>({
    isLoading: false,
    isImportingCsv: false,
    isLoadingParticipations: false,
    projects: [[], 0],
    project: null,
    participations: []
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _router: inject(Router),
    _toast: inject(ToastrService)
  })),
  withComputed(({ project }) => ({
    sortedPhases: computed(() => {
      const phases = project()?.phases;
      if (!phases) return [];
      return phases.sort((a, b) => parseDate(a.started_at).getTime() - parseDate(b.started_at).getTime());
    })
  })),
  withMethods(({ _http, _router, _toast, ...store }) => ({
    loadAll: rxMethod<FilterProjectCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IProject[], number] }>('projects', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, projects: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, projects: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) => {
          return _http.get<{ data: IProject }>(`projects/slug/${slug}`).pipe(
            tap(({ data }) => {
              patchState(store, { isLoading: false, project: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    loadParticipations: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoadingParticipations: true, participations: [] })),
        switchMap((projectId) =>
          _http.get<{ data: ProjectParticipation[] }>(`projects/${projectId}/participations`).pipe(
            map(({ data }) => patchState(store, { participations: data ?? [], isLoadingParticipations: false })),
            catchError(() => {
              patchState(store, { participations: [], isLoadingParticipations: false });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) => {
          return _http.post<{ data: IProject }>('projects', project).pipe(
            map(({ data }) => {
              _toast.showSuccess('Le projet a été ajouté avec succès');
              _router.navigate(['/projects']);
              patchState(store, { isLoading: false, project: data });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de l'ajout du projet");
              patchState(store, { isLoading: false, project: null });
              return of(null);
            })
          );
        })
      )
    ),
    update: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) => {
          return _http.patch<{ data: IProject }>(`projects/${project.id}`, project).pipe(
            map(({ data }) => {
              _toast.showSuccess('Le projet a été mis à jour avec succès');
              _router.navigate(['/projects']);
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, project: data, projects: [updated, count] });
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
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return _http.post<{ data: IProject }>(`projects/publish/${id}`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, projects: [updated, count], project: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return _http.patch<{ data: IProject }>(`projects/highlight/${id}`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              _toast.showSuccess('Projet mis en avant avec succès');
              patchState(store, { isLoading: false, projects: [updated, count], project: data });
            }),
            catchError(() => {
              _toast.showError('Erreur lors de la mise en avant du projet');
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
        switchMap((id) => {
          return _http.delete<{ data: IProject }>(`projects/${id}`).pipe(
            tap(() => {
              const [list, count] = store.projects();
              const filtered = list.filter((p) => p.id !== id);
              _toast.showSuccess('Le projet a été supprimé avec succès');
              patchState(store, { isLoading: false, projects: [filtered, Math.max(0, count - 1)], project: null });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la suppression");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    importParticipantsCsv: rxMethod<{ projectId: string; file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ projectId, file, onSuccess }) => {
          const formData = new FormData();
          formData.append('file', file);
          return _http.post<unknown>(`projects/${projectId}/participants/csv`, formData).pipe(
            map(() => {
              _toast.showSuccess('Les participants ont été importés avec succès');
              patchState(store, { isImportingCsv: false });
              onSuccess();
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de l'import des participants");
              patchState(store, { isImportingCsv: false });
              return of(null);
            })
          );
        })
      )
    )
  }))
);
