import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { IImage } from '@shared/models';

interface IGalleryStore {
  isLoading: boolean;
  gallery: IImage[];
}

export const GalleryStore = signalStore(
  withState<IGalleryStore>({ isLoading: false, gallery: [] }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _http.get<{ data: IImage[] }>(`events/by-slug/${slug}/gallery`).pipe(
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
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _http.delete<void>(`events/gallery/${id}`).pipe(
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
