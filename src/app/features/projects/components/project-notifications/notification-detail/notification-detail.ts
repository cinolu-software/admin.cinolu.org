import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { environment } from '@env/environment';
import { NotificationDetailState } from '@features/projects/types';
import { INotification } from '@shared/models';
import { UiButton } from '@shared/ui';
import { LucideAngularModule, Paperclip, Pencil, Send, Trash2 } from 'lucide-angular';

const ALL_PARTICIPANTS_LABEL = 'Tous les participants';
const STAFF_RECIPIENT_LABEL = 'Destinataires: staff';

@Component({
  selector: 'app-notification-detail',
  templateUrl: './notification-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiButton, LucideAngularModule]
})
export class NotificationDetail {
  state = input.required<NotificationDetailState>();
  resendNotification = output<INotification>();
  editNotification = output<void>();
  deleteNotification = output<INotification>();
  actionLoading = signal<'send' | null>(null);
  icons = { Paperclip, Send, Trash2, Pencil };

  constructor() {
    effect(() => {
      if (this.state().isSaving) return;
      this.actionLoading.set(null);
    });
  }

  onResendNotification(): void {
    this.actionLoading.set('send');
    this.resendNotification.emit(this.state().notification);
  }

  onEditNotification(): void {
    this.editNotification.emit();
  }

  onDeleteNotification(): void {
    this.deleteNotification.emit(this.state().notification);
  }

  phaseLabel(): string {
    const notification = this.state().notification;
    if (notification.notify_staff) return STAFF_RECIPIENT_LABEL;
    if (!notification.phase?.name) return ALL_PARTICIPANTS_LABEL;
    return notification.notify_mentors
      ? `Phase: ${notification.phase.name} · mentors uniquement`
      : `Phase: ${notification.phase.name}`;
  }

  senderName(): string {
    return this.state().notification.sender?.name || this.state().fallbackSenderName;
  }

  senderEmail(): string {
    return this.state().notification.sender?.email || this.state().fallbackSenderEmail;
  }

  bodyHtml(): string {
    return this.state().notification.body ?? '';
  }

  attachmentSummary(): string {
    const total = this.state().notification.attachments?.length ?? 0;
    return `${total} pièces jointes`;
  }

  attachmentUrl(filename: string): string {
    return `${environment.apiUrl}uploads/notifications/${filename}`;
  }
}
