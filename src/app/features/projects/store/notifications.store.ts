import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { INotification, INotificationAttachment } from '@shared/models';
import { NotifyParticipantsDto } from '../dto/notifications/notify-participants.dto';
import { buildQueryParams } from '@shared/helpers';
import { NotificationStatus } from '../types/notification-status.enum';

export interface FilterProjectNotificationsDto {
  phaseId: string;
  status: NotificationStatus | null;
  page: string | null;
}

interface INotificationsState {
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  notifications: [INotification[], number];
  activeNotification: INotification | null;
}

interface INotificationsStateWithError extends INotificationsState {
  error: string | null;
}

export const NotificationsStore = signalStore(
  withState<INotificationsStateWithError>({
    isLoading: false,
    isSaving: false,
    isUploading: false,
    notifications: [[], 0],
    activeNotification: null,
    error: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withComputed(({ notifications }) => ({
    total: computed(() => notifications()[1]),
    list: computed(() => notifications()[0])
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<{ projectId: string; filters: FilterProjectNotificationsDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ projectId, filters }) => {
          const params = buildQueryParams(filters);
          return _http.get<{ data: [INotification[], number] }>(`notifications/project/${projectId}`, { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, notifications: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, notifications: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    create: rxMethod<{ projectId: string; dto: NotifyParticipantsDto; onSuccess?: (data: INotification) => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap(({ projectId, dto, onSuccess }) =>
          _http.post<{ data: INotification }>(`projects/${projectId}/notification`, dto).pipe(
            map(({ data }) => {
              const [list, count] = store.notifications();
              patchState(store, {
                isSaving: false,
                error: null,
                notifications: [[data, ...list], count + 1],
                activeNotification: data
              });
              onSuccess?.(data);
            }),
            catchError(() => {
              patchState(store, {
                isSaving: false,
                error: "Une erreur s'est produite lors de la création de la notification"
              });
              return of(null);
            })
          )
        )
      )
    ),
    send: rxMethod<{ notificationId: string; onSuccess?: (data: INotification) => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap(({ notificationId, onSuccess }) =>
          _http.post<{ data: INotification }>(`projects/notify/${notificationId}`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.notifications();
              const updated = list.map((item) => (item.id === data.id ? data : item));
              patchState(store, {
                isSaving: false,
                error: null,
                notifications: [updated, count],
                activeNotification: data
              });
              onSuccess?.(data);
            }),
            catchError(() => {
              patchState(store, {
                isSaving: false,
                error: "Une erreur s'est produite lors de l'envoi de la notification"
              });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; dto: NotifyParticipantsDto; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap(({ id, dto, onSuccess }) =>
          _http.patch<{ data: INotification }>(`notifications/${id}`, dto).pipe(
            map(({ data }) => {
              _toast.showSuccess('La notification a été mise à jour');
              const [list, count] = store.notifications();
              const updated = list.map((item) => (item.id === data.id ? data : item));
              patchState(store, { isSaving: false, notifications: [updated, count], activeNotification: data });
              onSuccess?.();
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la mise à jour");
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    delete: rxMethod<{ id: string; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ id, onSuccess }) =>
          _http.delete<void>(`notifications/${id}`).pipe(
            tap(() => {
              _toast.showSuccess('La notification a été supprimée');
              const [list, count] = store.notifications();
              const filtered = list.filter((item) => item.id !== id);
              const active = store.activeNotification();
              patchState(store, {
                isSaving: false,
                notifications: [filtered, Math.max(0, count - 1)],
                activeNotification: active?.id === id ? null : active
              });
              onSuccess?.();
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la suppression");
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    addAttachments: rxMethod<{ id: string; attachments: File[]; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isUploading: true, error: null })),
        switchMap(({ id, attachments, onSuccess }) => {
          const formData = new FormData();
          attachments.forEach((file) => formData.append('attachments', file));
          return _http.post<{ data: INotification }>(`notifications/${id}/attachments`, formData).pipe(
            map(({ data }) => {
              const [list, count] = store.notifications();
              const updated = list.map((item) => (item.id === data.id ? data : item));
              patchState(store, {
                isUploading: false,
                error: null,
                notifications: [updated, count],
                activeNotification: data
              });
              onSuccess?.();
            }),
            catchError(() => {
              patchState(store, {
                isUploading: false,
                error: "Une erreur s'est produite lors de l'ajout des pièces jointes"
              });
              return of(null);
            })
          );
        })
      )
    ),
    deleteAttachments: rxMethod<{ id: string; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isUploading: true })),
        switchMap(({ id, onSuccess }) =>
          _http.delete<void>(`notifications/${id}/attachements`).pipe(
            tap(() => {
              _toast.showSuccess('Les pièces jointes ont été supprimées');
              const [list, count] = store.notifications();
              const updated = list.map((item) =>
                item.id === id ? { ...item, attachments: [] as INotificationAttachment[] } : item
              );
              const active = store.activeNotification();
              patchState(store, {
                isUploading: false,
                notifications: [updated, count],
                activeNotification: active?.id === id ? { ...active, attachments: [] } : active
              });
              onSuccess?.();
            }),
            catchError(() => {
              _toast.showError("Une erreur s'est produite lors de la suppression des pièces jointes");
              patchState(store, { isUploading: false });
              return of(null);
            })
          )
        )
      )
    ),
    setActiveNotification: (notification: INotification | null): void => {
      patchState(store, { activeNotification: notification });
    },
    clearError: (): void => {
      patchState(store, { error: null });
    },
    createNotifyAndSend: rxMethod<{
      projectId: string;
      dto: NotifyParticipantsDto;
      attachments?: File[];
      onSuccess?: () => void;
    }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap((input) => {
          const { projectId, dto, attachments = [] } = input;
          return _http.post<{ data: INotification }>(`projects/${projectId}/notification`, dto).pipe(
            concatMap((createRes) => {
              const notification = createRes.data;
              const [list, count] = store.notifications();
              patchState(store, {
                notifications: [[notification, ...list], count + 1],
                activeNotification: notification
              });
              if (attachments.length === 0) {
                return of(notification);
              }
              const formData = new FormData();
              attachments.forEach((file) => formData.append('attachments', file));
              return _http
                .post<{ data: INotification }>(`notifications/${notification.id}/attachments`, formData)
                .pipe(map((res) => res.data));
            }),
            concatMap((notification) => _http.post<{ data: INotification }>(`projects/notify/${notification.id}`, {})),
            tap(({ data }) => {
              const [list, count] = store.notifications();
              const updated = list.map((item) => (item.id === data.id ? data : item));
              patchState(store, {
                isSaving: false,
                error: null,
                notifications: [updated, count],
                activeNotification: data
              });
              input.onSuccess?.();
            }),
            catchError(() => {
              patchState(store, {
                isSaving: false,
                error: "Une erreur s'est produite lors de l'envoi"
              });
              return of(null);
            })
          );
        }),
        catchError(() => of(null))
      )
    ),
    updateWithAttachments: rxMethod<{
      id: string;
      dto: NotifyParticipantsDto;
      attachments?: File[];
      onSuccess?: () => void;
    }>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap((input) => {
          const { id, dto, attachments = [] } = input;
          return _http.patch<{ data: INotification }>(`notifications/${id}`, dto).pipe(
            concatMap((updateRes) => {
              const notification = updateRes.data;
              const [list, count] = store.notifications();
              patchState(store, {
                notifications: [list.map((i) => (i.id === id ? notification : i)), count],
                activeNotification: notification
              });
              if (attachments.length === 0) {
                return of(notification);
              }
              const formData = new FormData();
              attachments.forEach((file) => formData.append('attachments', file));
              return _http
                .post<{ data: INotification }>(`notifications/${id}/attachments`, formData)
                .pipe(map((res) => res.data));
            }),
            tap((data) => {
              const [list, count] = store.notifications();
              const updated = list.map((item) => (item.id === data.id ? data : item));
              patchState(store, {
                isSaving: false,
                error: null,
                notifications: [updated, count],
                activeNotification: data
              });
              input.onSuccess?.();
            }),
            catchError(() => {
              patchState(store, {
                isSaving: false,
                error: "Une erreur s'est produite lors de la mise à jour"
              });
              return of(null);
            })
          );
        }),
        catchError(() => of(null))
      )
    )
  }))
);
