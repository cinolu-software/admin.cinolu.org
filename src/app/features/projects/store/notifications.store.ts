import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, exhaustMap, map, of, pipe, switchMap, tap } from 'rxjs';
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

interface NotificationsState {
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  notifications: [INotification[], number];
  activeNotification: INotification | null;
  error: string | null;
}

export const NotificationsStore = signalStore(
  withState<NotificationsState>({
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
  withMethods(({ _http, _toast, ...store }) => {
    const emptyNotifications: [INotification[], number] = [[], 0];
    const upsertNotificationState = (
      notification: INotification
    ): Pick<NotificationsState, 'notifications' | 'activeNotification'> => {
      const [list, count] = store.notifications();
      const exists = list.some((item) => item.id === notification.id);
      const nextList = exists
        ? list.map((item) => (item.id === notification.id ? notification : item))
        : [notification, ...list];
      return {
        notifications: [nextList, exists ? count : count + 1],
        activeNotification: notification
      };
    };
    const clearNotificationsState = (): Pick<NotificationsState, 'notifications' | 'activeNotification'> => ({
      notifications: emptyNotifications,
      activeNotification: null
    });
    const failSaving = (message: string) => {
      patchState(store, { isSaving: false, error: message });
      return of(null);
    };
    const uploadAttachments = (notificationId: string, attachments: File[]) => {
      const formData = new FormData();
      attachments.forEach((file) => formData.append('attachments', file));
      return _http
        .post<{ data: INotification }>(`notifications/${notificationId}/attachments`, formData)
        .pipe(map(({ data }) => data));
    };
    const loadNotifications = (projectId: string, filters: FilterProjectNotificationsDto) => {
      const params = buildQueryParams(filters);
      return _http.get<{ data: [INotification[], number] }>(`notifications/project/${projectId}`, { params });
    };
    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterProjectNotificationsDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ projectId, filters }) =>
            loadNotifications(projectId, filters).pipe(
              tap(({ data }) => patchState(store, { isLoading: false, notifications: data })),
              catchError(() => {
                patchState(store, { isLoading: false, ...clearNotificationsState() });
                return of(null);
              })
            )
          )
        )
      ),
      loadAllAndSelectNotification: rxMethod<{
        projectId: string;
        filters: FilterProjectNotificationsDto;
        notificationId: string;
      }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ projectId, filters, notificationId }) =>
            loadNotifications(projectId, filters).pipe(
              tap(({ data }) => {
                const [list] = data;
                patchState(store, {
                  isLoading: false,
                  notifications: data,
                  activeNotification: list.find((item) => item.id === notificationId) ?? null
                });
              }),
              catchError(() => {
                patchState(store, { isLoading: false, ...clearNotificationsState() });
                return of(null);
              })
            )
          )
        )
      ),
      create: rxMethod<{
        projectId: string;
        dto: NotifyParticipantsDto;
        attachments?: File[];
        onSuccess?: (data: INotification) => void;
      }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          exhaustMap(({ projectId, dto, attachments = [], onSuccess }) =>
            _http.post<{ data: INotification }>(`projects/${projectId}/notifications`, dto).pipe(
              map(({ data }) => data),
              tap((notification) => patchState(store, upsertNotificationState(notification))),
              concatMap((notification) => {
                if (attachments.length === 0) {
                  patchState(store, { isSaving: false, error: null });
                  onSuccess?.(notification);
                  return of(notification);
                }
                return uploadAttachments(notification.id, attachments).pipe(
                  tap((notificationWithAttachments) => {
                    patchState(store, {
                      isSaving: false,
                      error: null,
                      ...upsertNotificationState(notificationWithAttachments)
                    });
                    onSuccess?.(notificationWithAttachments);
                  }),
                  catchError(() => failSaving("Une erreur s'est produite lors de l'ajout des pièces jointes"))
                );
              }),
              catchError(() => failSaving("Une erreur s'est produite lors de la création de la notification"))
            )
          )
        )
      ),
      send: rxMethod<{ notificationId: string; onSuccess?: (data: INotification) => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          exhaustMap(({ notificationId, onSuccess }) =>
            _http.post<{ data: INotification }>(`projects/notifications/${notificationId}/send`, {}).pipe(
              tap(({ data }) => {
                patchState(store, { isSaving: false, error: null, ...upsertNotificationState(data) });
                onSuccess?.(data);
              }),
              catchError(() => failSaving("Une erreur s'est produite lors de l'envoi de la notification"))
            )
          )
        )
      ),
      delete: rxMethod<{ id: string }>(
        pipe(
          tap(() => patchState(store, { isSaving: true })),
          exhaustMap(({ id }) =>
            _http.delete<void>(`notifications/${id}`).pipe(
              tap(() => {
                _toast.showSuccess('La notification a été supprimée');
                const [list, count] = store.notifications();
                const active = store.activeNotification();
                patchState(store, {
                  isSaving: false,
                  notifications: [list.filter((item) => item.id !== id), Math.max(0, count - 1)],
                  activeNotification: active?.id === id ? null : active
                });
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
      deleteAttachments: rxMethod<{ id: string; onSuccess?: () => void }>(
        pipe(
          tap(() => patchState(store, { isUploading: true })),
          exhaustMap(({ id, onSuccess }) =>
            _http.delete<void>(`notifications/${id}/attachments`).pipe(
              tap(() => {
                _toast.showSuccess('Les pièces jointes ont été supprimées');
                const [list, count] = store.notifications();
                const active = store.activeNotification();
                patchState(store, {
                  isUploading: false,
                  notifications: [
                    list.map((item) =>
                      item.id === id ? { ...item, attachments: [] as INotificationAttachment[] } : item
                    ),
                    count
                  ],
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
          exhaustMap(({ projectId, dto, attachments = [], onSuccess }) =>
            _http.post<{ data: INotification }>(`projects/${projectId}/notifications`, dto).pipe(
              map(({ data }) => data),
              tap((notification) => patchState(store, upsertNotificationState(notification))),
              concatMap((notification) => {
                if (attachments.length === 0) return of(notification);
                return uploadAttachments(notification.id, attachments);
              }),
              concatMap((notification) =>
                _http.post<{ data: INotification }>(`projects/notifications/${notification.id}/send`, {})
              ),
              tap(({ data }) => {
                patchState(store, { isSaving: false, error: null, ...upsertNotificationState(data) });
                onSuccess?.();
              }),
              catchError(() => failSaving("Une erreur s'est produite lors de l'envoi"))
            )
          )
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
          exhaustMap(({ id, dto, attachments = [], onSuccess }) =>
            _http.patch<{ data: INotification }>(`notifications/${id}`, dto).pipe(
              map(({ data }) => data),
              tap((notification) => patchState(store, upsertNotificationState(notification))),
              concatMap((notification) => {
                if (attachments.length === 0) return of(notification);
                return uploadAttachments(id, attachments);
              }),
              tap((notification) => {
                patchState(store, { isSaving: false, error: null, ...upsertNotificationState(notification) });
                onSuccess?.();
              }),
              catchError(() => failSaving("Une erreur s'est produite lors de la mise à jour"))
            )
          )
        )
      )
    };
  })
);
