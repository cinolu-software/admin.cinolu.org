import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, exhaustMap, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';
import { buildQueryParams } from '@shared/helpers';
import { ITag } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ArticleTagDto } from '../dto/article-tag.dto';

interface ITagsStore {
  isLoading: boolean;
  tags: [ITag[], number];
  allTags: ITag[];
  lastQuery: FilterArticlesTagsDto | null;
}

export const TagsStore = signalStore(
  withState<ITagsStore>({ isLoading: false, allTags: [], tags: [[], 0], lastQuery: null }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadUpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() => {
          return _http.get<{ data: ITag[] }>('tags').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, allTags: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, allTags: [] });
              return of(null);
            })
          );
        })
      )
    ),
    loadAll: rxMethod<FilterArticlesTagsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          patchState(store, { lastQuery: queryParams });
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [ITag[], number] }>('tags/paginated', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, tags: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, tags: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    create: rxMethod<{ payload: ArticleTagDto; onSuccess: (tag: ITag) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _http.post<{ data: ITag }>('tags', payload).pipe(
            map(({ data }) => {
              const [tags, count] = store.tags();
              const allTags = store.allTags();
              const hasTag = allTags.some((tag) => tag.id === data.id);
              patchState(store, {
                tags: [[data, ...tags], count + 1],
                allTags: hasTag ? allTags : [data, ...allTags]
              });
              _toast.showSuccess('Tag ajoutée avec succès');
              patchState(store, { isLoading: false });
              onSuccess(data);
            }),
            catchError(() => {
              _toast.showError("Échec de l'ajout du tag");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _http.patch<{ data: ITag }>(`tags/${id}`, payload).pipe(
            map(({ data }) => {
              const [tags, count] = store.tags();
              const updated = tags.map((t) => (t.id === data.id ? data : t));
              patchState(store, { tags: [updated, count] });
              _toast.showSuccess('Tag mise à jour');
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
    delete: rxMethod<{ id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id }) =>
          _http.delete<void>(`tags/${id}`).pipe(
            map(() => {
              const [tags, count] = store.tags();
              const filtered = tags.filter((tag) => tag.id !== id);
              patchState(store, { tags: [filtered, count - 1] });
              patchState(store, { isLoading: false });
              _toast.showSuccess('Tag supprimée avec succès');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError('Échec de la suppression du tag');
              return of(null);
            })
          )
        )
      )
    )
  }))
);
