import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withProps, withHooks } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, catchError, of, exhaustMap } from 'rxjs';
import { IAdminStats } from '../types/stats.type';

interface IAdminStatsStore {
  isLoading: boolean;
  stats: IAdminStats | null;
}

export const AdminStatsStore = signalStore(
  withState<IAdminStatsStore>({ isLoading: false, stats: null }),
  withProps(() => ({
    _http: inject(HttpClient)
  })),
  withMethods(({ _http, ...store }) => ({
    getAdminStats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() => {
          return _http.get<{ data: IAdminStats }>('stats/admin').pipe(
            tap(({ data }) => {
              patchState(store, { isLoading: false, stats: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, stats: null });
              return of(null);
            })
          );
        })
      )
    )
  })),
  withHooks({
    onInit({ getAdminStats }) {
      getAdminStats();
    }
  })
);
