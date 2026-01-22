import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { IOpportunity } from '@shared/models';
import { buildQueryParams } from '@shared/helpers';
import { FilterOpportunitiesDto } from '../dto/opportunities/filter-opportunities.dto';
import { OpportunityDto } from '../dto/opportunities/opportunity.dto';
import { IAttachment } from '@shared/models';

interface IOpportunitiesStore {
  isLoading: boolean;
  opportunities: [IOpportunity[], number];
  opportunity: IOpportunity | null;
}

export const OpportunitiesStore = signalStore(
  withState<IOpportunitiesStore>({
    isLoading: false,
    opportunities: [[], 0],
    opportunity: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _router: inject(Router),
    _toast: inject(ToastrService)
  })),
  withMethods(({ _http, _router, _toast, ...store }) => ({
    loadAll: rxMethod<FilterOpportunitiesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return _http.get<{ data: [IOpportunity[], number] }>('opportunities/all', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, opportunities: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, opportunities: [[], 0] });
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
          _http.get<{ data: IOpportunity }>(`opportunities/slug/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, opportunity: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, opportunity: null });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<OpportunityDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.post<{ data: IOpportunity }>('opportunities', payload).pipe(
            map(({ data }) => {
              _toast.showSuccess("L'opportunité a été ajoutée avec succès");
              _router.navigate(['/opportunities']);
              patchState(store, { isLoading: false, opportunity: data });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de l'ajout de l'opportunité");
              patchState(store, { isLoading: false, opportunity: null });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<OpportunityDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _http.patch<{ data: IOpportunity }>(`opportunities/${payload.id}`, payload).pipe(
            map(({ data }) => {
              _toast.showSuccess("L'opportunité a été mise à jour avec succès");
              _router.navigate(['/opportunities']);
              const [list, count] = store.opportunities();
              const updated = list.map((o) => (o.id === data.id ? data : o));
              patchState(store, { isLoading: false, opportunity: data, opportunities: [updated, count] });
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
          _http.delete<void>(`opportunities/${id}`).pipe(
            tap(() => {
              const [list, count] = store.opportunities();
              const filtered = list.filter((o) => o.id !== id);
              _toast.showSuccess("L'opportunité a été supprimée avec succès");
              patchState(store, {
                isLoading: false,
                opportunities: [filtered, Math.max(0, count - 1)],
                opportunity: null
              });
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
    addAttachment: rxMethod<{ id: string; file: File }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, file }) => {
          const formData = new FormData();
          formData.append('file', file);
          return _http.post<{ data: IAttachment }>(`opportunities/${id}/attachments`, formData).pipe(
            map(({ data }) => {
              const opportunity = store.opportunity();
              if (opportunity) {
                patchState(store, {
                  opportunity: { ...opportunity, attachments: [...opportunity.attachments, data] }
                });
              }
              _toast.showSuccess("L'annexe a été ajoutée avec succès");
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de l'ajout de l'annexe");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    deleteAttachment: rxMethod<{ id: string; attachmentId: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, attachmentId }) =>
          _http.delete<void>(`opportunities/${id}/attachments/${attachmentId}`).pipe(
            map(() => {
              const opportunity = store.opportunity();
              if (opportunity) {
                const filtered = opportunity.attachments.filter((a) => a.id !== attachmentId);
                patchState(store, {
                  opportunity: { ...opportunity, attachments: filtered }
                });
              }
              _toast.showSuccess("L'annexe a été supprimée avec succès");
              patchState(store, { isLoading: false });
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la suppression de l'annexe");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
