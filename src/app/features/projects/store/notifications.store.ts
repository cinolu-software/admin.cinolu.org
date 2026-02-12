import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, map, of, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { buildQueryParams } from '@shared/helpers';
import { INotification, INotificationAttachment } from '@shared/models';
import { NotifyParticipantsDto } from '../dto/notifications/notify-participants.dto';
import { NotificationStatus } from '../types/notification-status.enum';

export interface FilterProjectNotificationsDto {
  phaseId: string;
  status: NotificationStatus | null;
  page: string | null;
}

type PaginatedNotifications = [INotification[], number];

interface NotificationsState {
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  notifications: PaginatedNotifications;
  activeNotification: INotification | null;
  error: string | null;
}

const initialState: NotificationsState = {
  isLoading: false,
  isSaving: false,
  isUploading: false,
  notifications: [[], 0],
  activeNotification: null,
  error: null
};

export const NotificationsStore = signalStore(
  withState<NotificationsState>(initialState),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withComputed(({ notifications }) => ({
    total: computed(() => notifications()[1]),
    list: computed(() => notifications()[0])
  })),
  withMethods(({ _http, _toast, ...store }) => {
    const setBusy = (key: 'isLoading' | 'isSaving' | 'isUploading', value: boolean) =>
      patchState(store, { [key]: value } as Partial<NotificationsState>);
    const setError = (message: string | null) => patchState(store, { error: message });
    const getList = () => store.notifications()[0];
    const getCount = () => store.notifications()[1];
    const setNotifications = (data: PaginatedNotifications) => patchState(store, { notifications: data });
    const prependOne = (n: INotification) => {
      const [list, count] = store.notifications();
      setNotifications([[n, ...list], count + 1]);
    };
    const replaceOne = (n: INotification) => {
      const [list, count] = store.notifications();
      setNotifications([list.map((i) => (i.id === n.id ? n : i)), count]);
    };
    const removeOne = (id: string) => {
      const [list, count] = store.notifications();
      setNotifications([list.filter((i) => i.id !== id), Math.max(0, count - 1)]);
    };
    const setActiveIfMatches = (id: string, next: INotification | null) => {
      const active = store.activeNotification();
      if (active?.id === id) patchState(store, { activeNotification: next });
    };
    const uploadAttachments = (notificationId: string, attachments: File[]) => {
      if (!attachments.length) return of<INotification | null>(null);
      const formData = new FormData();
      attachments.forEach((file) => formData.append('attachments', file));
      return _http
        .post<{ data: INotification }>(`notifications/${notificationId}/attachments`, formData)
        .pipe(map((res) => res.data));
    };
    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterProjectNotificationsDto }>(
        pipe(
          tap(() => setBusy('isLoading', true)),
          switchMap(({ projectId, filters }) => {
            const params = buildQueryParams(filters);
            return _http.get<{ data: PaginatedNotifications }>(`notifications/project/${projectId}`, { params }).pipe(
              tap(({ data }) => patchState(store, { isLoading: false, notifications: data })),
              catchError(() => {
                patchState(store, { isLoading: false, notifications: [[], 0] });
                return of(null);
              })
            );
          })
        )
      ),
      create: rxMethod<{
        projectId: string;
        dto: NotifyParticipantsDto;
        attachments?: File[];
        onSuccess?: (data: INotification) => void;
      }>(
        pipe(
          tap(() => {
            setBusy('isSaving', true);
            setError(null);
          }),
          switchMap(({ projectId, dto, attachments = [], onSuccess }) =>
            _http.post<{ data: INotification }>(`projects/${projectId}/notification`, dto).pipe(
              map((res) => res.data),
              tap((created) => {
                prependOne(created);
                patchState(store, { activeNotification: created });
              }),
              concatMap((created) =>
                uploadAttachments(created.id, attachments).pipe(
                  map((withAttachments) => withAttachments ?? created),
                  tap((finalNotification) => {
                    replaceOne(finalNotification);
                    patchState(store, { activeNotification: finalNotification });
                    setBusy('isSaving', false);
                    setError(null);
                    onSuccess?.(finalNotification);
                  }),
                  catchError(() => {
                    setBusy('isSaving', false);
                    setError("Une erreur s'est produite lors de l'ajout des pièces jointes");
                    return of(null);
                  })
                )
              ),
              catchError(() => {
                setBusy('isSaving', false);
                setError("Une erreur s'est produite lors de la création de la notification");
                return of(null);
              })
            )
          )
        )
      ),
      send: rxMethod<{ notificationId: string; onSuccess?: (data: INotification) => void }>(
        pipe(
          tap(() => {
            setBusy('isSaving', true);
            setError(null);
          }),
          switchMap(({ notificationId, onSuccess }) =>
            _http.post<{ data: INotification }>(`projects/notify/${notificationId}`, {}).pipe(
              map((res) => res.data),
              tap((updated) => {
                replaceOne(updated);
                patchState(store, { activeNotification: updated });
                setBusy('isSaving', false);
                onSuccess?.(updated);
              }),
              catchError(() => {
                setBusy('isSaving', false);
                setError("Une erreur s'est produite lors de l'envoi de la notification");
                return of(null);
              })
            )
          )
        )
      ),
      remove: rxMethod<{ id: string }>(
        pipe(
          tap(() => setBusy('isSaving', true)),
          switchMap(({ id }) =>
            _http.delete<void>(`notifications/${id}`).pipe(
              tap(() => {
                _toast.showSuccess('La notification a été supprimée');
                removeOne(id);
                setActiveIfMatches(id, null);
                setBusy('isSaving', false);
              }),
              catchError(() => {
                _toast.showError("Une erreur s'est produite lors de la suppression");
                setBusy('isSaving', false);
                return of(null);
              })
            )
          )
        )
      ),
      deleteAttachments: rxMethod<{ id: string; onSuccess?: () => void }>(
        pipe(
          tap(() => setBusy('isUploading', true)),
          switchMap(({ id, onSuccess }) =>
            _http.delete<void>(`notifications/${id}/attachments`).pipe(
              tap(() => {
                _toast.showSuccess('Les pièces jointes ont été supprimées');
                const updatedList = getList().map((item) =>
                  item.id === id ? { ...item, attachments: [] as INotificationAttachment[] } : item
                );
                setNotifications([updatedList, getCount()]);
                const active = store.activeNotification();
                if (active?.id === id) patchState(store, { activeNotification: { ...active, attachments: [] } });
                setBusy('isUploading', false);
                onSuccess?.();
              }),
              catchError(() => {
                _toast.showError("Une erreur s'est produite lors de la suppression des pièces jointes");
                setBusy('isUploading', false);
                return of(null);
              })
            )
          )
        )
      ),
      createNotifyAndSend: rxMethod<{
        projectId: string;
        dto: NotifyParticipantsDto;
        attachments?: File[];
        onSuccess?: () => void;
      }>(
        pipe(
          tap(() => {
            setBusy('isSaving', true);
            setError(null);
          }),
          switchMap(({ projectId, dto, attachments = [], onSuccess }) =>
            _http.post<{ data: INotification }>(`projects/${projectId}/notification`, dto).pipe(
              map((res) => res.data),
              tap((created) => {
                prependOne(created);
                patchState(store, { activeNotification: created });
              }),
              concatMap((created) => uploadAttachments(created.id, attachments).pipe(map((x) => x ?? created))),
              concatMap((notif) =>
                _http.post<{ data: INotification }>(`projects/notify/${notif.id}`, {}).pipe(map((r) => r.data))
              ),
              tap((sent) => {
                replaceOne(sent);
                patchState(store, { activeNotification: sent });
                setBusy('isSaving', false);
                onSuccess?.();
              }),
              catchError(() => {
                setBusy('isSaving', false);
                setError("Une erreur s'est produite lors de l'envoi");
                return of(null);
              })
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
          tap(() => {
            setBusy('isSaving', true);
            setError(null);
          }),
          switchMap(({ id, dto, attachments = [], onSuccess }) =>
            _http.patch<{ data: INotification }>(`notifications/${id}`, dto).pipe(
              map((res) => res.data),
              tap((updated) => {
                replaceOne(updated);
                patchState(store, { activeNotification: updated });
              }),
              concatMap((updated) => uploadAttachments(id, attachments).pipe(map((x) => x ?? updated))),
              tap((finalNotif) => {
                replaceOne(finalNotif);
                patchState(store, { activeNotification: finalNotif });
                setBusy('isSaving', false);
                onSuccess?.();
              }),
              catchError(() => {
                setBusy('isSaving', false);
                setError("Une erreur s'est produite lors de la mise à jour");
                return of(null);
              })
            )
          )
        )
      ),
      setActiveNotification: (notification: INotification | null) =>
        patchState(store, { activeNotification: notification }),
      clearError: () => setError(null)
    };
  })
);
