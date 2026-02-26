import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import type { IGeneralStats, IStatsByYear } from '../types/stats.type';

interface IStatsStore {
  isLoadingGeneral: boolean;
  isLoadingByYear: boolean;
  general: IGeneralStats | null;
  byYear: IStatsByYear | null;
  selectedYear: number;
}

const currentYear = new Date().getFullYear();

export const StatsStore = signalStore(
  withState<IStatsStore>({
    isLoadingGeneral: false,
    isLoadingByYear: false,
    general: null,
    byYear: null,
    selectedYear: currentYear
  }),
  withProps(() => ({
    _http: inject(HttpClient)
  })),
  withMethods(({ _http, ...store }) => ({
    loadGeneral: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoadingGeneral: true })),
        switchMap(() =>
          _http.get<{ data: IGeneralStats } | IGeneralStats>('stats/admin/overview').pipe(
            map((res) => ('data' in res ? res.data : res)),
            tap((data) => patchState(store, { isLoadingGeneral: false, general: data })),
            catchError(() => {
              patchState(store, { isLoadingGeneral: false, general: null });
              return of(null);
            })
          )
        )
      )
    ),
    loadByYear: rxMethod<number>(
      pipe(
        tap((year) => patchState(store, { isLoadingByYear: true, selectedYear: year })),
        switchMap((year) =>
          _http.get<{ data: IStatsByYear } | IStatsByYear>(`stats/admin/year/${year}`).pipe(
            map((res) => ('data' in res ? res.data : res)),
            tap((data) => patchState(store, { isLoadingByYear: false, byYear: data })),
            catchError(() => {
              patchState(store, { isLoadingByYear: false, byYear: null });
              return of(null);
            })
          )
        )
      )
    )
  }))
);
