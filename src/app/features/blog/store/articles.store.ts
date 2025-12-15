import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';
import { buildQueryParams } from '@shared/helpers';
import { IArticle, IImage } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ArticleDto } from '../dto/article.dto';

interface IArticlesStore {
  isLoading: boolean;
  articles: [IArticle[], number];
  article: IArticle | null;
  gallery: IImage[];
  isLoadingTags: boolean;
}

export const ArticlesStore = signalStore(
  withState<IArticlesStore>({
    isLoading: false,
    articles: [[], 0],
    article: null,
    gallery: [],
    isLoadingTags: false
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _router: inject(Router),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _router, _toast, ...store }) => ({
    loadAll: rxMethod<FilterArticlesTagsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IArticle[], number] }>('articles', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, articles: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, articles: [[], 0] });
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
          _http.get<{ data: IArticle }>(`articles/slug/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, article: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.post<{ data: IArticle }>('articles', payload).pipe(
            map(({ data }) => {
              _toast.showSuccess("L'article a été ajouté avec succès");
              _router.navigate(['/blog/articles']);
              patchState(store, { isLoading: false, article: data });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de l'ajout");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.patch<{ data: IArticle }>(`articles/${payload.id}`, payload).pipe(
            map(({ data }) => {
              _toast.showSuccess("L'article a été mis à jour avec succès");
              _router.navigate(['/blog/articles']);
              const [list, count] = store.articles();
              const updated = list.map((a) => (a.id === data.id ? data : a));
              patchState(store, { isLoading: false, article: data, articles: [updated, count] });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la mise à jour");
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
          _http.delete<void>(`articles/${id}`).pipe(
            map(() => {
              const [list, count] = store.articles();
              const filtered = list.filter((a) => a.id !== id);
              _toast.showSuccess("L'article a été supprimé avec succès");
              patchState(store, { isLoading: false, articles: [filtered, Math.max(0, count - 1)] });
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
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.patch<{ data: IArticle }>(`articles/highlight/${id}`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.articles();
              const updated = list.map((a) => (a.id === data.id ? data : a));
              _toast.showSuccess(
                data.is_highlighted ? "L'article a été mis en avant" : "L'article n'est plus mis en avant"
              );
              patchState(store, { isLoading: false, articles: [updated, count], article: data });
            }),
            catchError(() => {
              _toast.showError("Erreur lors de la mise en avant de l'article");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    loadGallery: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _http.get<{ data: IImage[] }>(`articles/gallery/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, gallery: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, gallery: [] });
              return of(null);
            })
          )
        )
      )
    ),
    deleteImage: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.delete<void>(`articles/gallery/remove/${id}`).pipe(
            map(() => {
              const current = store.gallery();
              const filtered = current.filter((img) => img.id !== id);
              patchState(store, { isLoading: false, gallery: filtered });
              _toast.showSuccess('Image supprimée avec succès');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              _toast.showError("Échec de la suppression de l'image");
              return of(null);
            })
          )
        )
      )
    )
  }))
);
