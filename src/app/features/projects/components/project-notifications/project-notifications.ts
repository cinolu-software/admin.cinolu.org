import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ArrowLeft,
  CircleAlert,
  Paperclip,
  Send,
  Trash2,
  Pencil,
  Plus,
  X,
  Inbox,
  LucideAngularModule
} from 'lucide-angular';
import { UiButton, UiInput, UiSelect, UiTextEditor, UiConfirmDialog, UiPagination, SelectOption } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { INotification } from '@shared/models';
import { NotifyParticipantsDto } from '../../dto/notifications/notify-participants.dto';
import { NotificationsStore } from '../../store/notifications.store';
import { PhasesStore } from '@features/projects/store/phases.store';
import { AuthStore } from '@core/auth/auth.store';
import { environment } from '@env/environment';
import { NotificationStatus } from '@features/projects/types/notification-status.enum';

interface AttachmentPreview {
  file: File;
  id: string;
}

@Component({
  selector: 'app-project-notifications',
  templateUrl: './project-notifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationsStore, PhasesStore],
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiTextEditor,
    UiSelect,
    UiConfirmDialog,
    UiPagination,
    LucideAngularModule
  ]
})
export class ProjectNotifications implements OnInit {
  projectId = input.required<string>();
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #sanitizer = inject(DomSanitizer);
  authStore = inject(AuthStore);
  notificationsStore = inject(NotificationsStore);
  phasesStore = inject(PhasesStore);
  form = this.#buildForm();
  attachments = signal<AttachmentPreview[]>([]);
  isComposing = signal(true);
  filterPhaseId = signal('');
  filterStatus = signal<NotificationStatus | null>(null);
  filterPage = signal<number | null>(null);
  queryParams = computed(() => ({
    phaseId: this.filterPhaseId(),
    status: this.filterStatus(),
    page: this.filterPage() === null ? null : String(this.filterPage())
  }));
  currentPage = computed(() => this.filterPage() ?? 1);
  itemsPerPage = 10;
  icons = { ArrowLeft, CircleAlert, Paperclip, Send, Trash2, Pencil, Plus, X, Inbox };
  phaseOptions = computed(() => {
    const options = this.phasesStore.sortedPhases().map((phase) => ({
      label: phase.name,
      value: phase.id
    }));
    return [{ label: 'Tous les participants', value: '' }, ...options];
  });

  phaseFilterOptions = computed(() => {
    const options = this.phasesStore.sortedPhases().map((phase) => ({
      label: phase.name,
      value: phase.id
    }));
    return [{ label: 'Toutes les phases', value: '' }, ...options];
  });
  statusFilterOptions: SelectOption[] = [
    { label: 'Tous', value: '' },
    { label: 'Brouillon', value: 'draft' },
    { label: 'Envoyée', value: 'sent' }
  ];
  activeNotification = computed(() => this.notificationsStore.activeNotification());

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (!projectId) return;
      this.notificationsStore.loadAll({ projectId, filters: this.queryParams() });
    });
  }

  ngOnInit(): void {
    this.phasesStore.loadAll(this.projectId());
  }

  #buildForm(): FormGroup {
    return this.#fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      body: ['', [Validators.required, Validators.minLength(10)]],
      phase_id: ['']
    });
  }

  onFilterPhaseChange(value: string): void {
    this.filterPhaseId.set(value ?? '');
    this.filterPage.set(null);
  }

  onFilterStatusChange(value: NotificationStatus | null): void {
    this.filterStatus.set(value);
    this.filterPage.set(null);
  }

  onSelectNotification(notification: INotification): void {
    this.notificationsStore.setActiveNotification(notification);
    this.notificationsStore.clearError();
    this.isComposing.set(false);
  }

  onComposeNew(): void {
    this.notificationsStore.setActiveNotification(null);
    this.notificationsStore.clearError();
    this.form.reset({ title: '', body: '', phase_id: '' });
    this.attachments.set([]);
    this.isComposing.set(true);
  }

  onEditNotification(): void {
    const current = this.activeNotification();
    if (!current) return;
    this.form.patchValue({
      title: current.title,
      body: current.body,
      phase_id: current.phase_id ?? current.phase?.id ?? ''
    });
    this.attachments.set([]);
    this.notificationsStore.clearError();
    this.isComposing.set(true);
  }

  onCancelCompose(): void {
    this.isComposing.set(false);
    this.attachments.set([]);
    this.notificationsStore.clearError();
  }

  onPageChange(page: number): void {
    this.filterPage.set(page === 1 ? null : page);
  }

  onSelectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    const existing = this.attachments();
    const merged = [...existing];
    files.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!merged.some((item) => item.id === key)) {
        merged.push({ file, id: key });
      }
    });
    this.attachments.set(merged);
    input.value = '';
  }

  removeAttachment(id: string): void {
    this.attachments.set(this.attachments().filter((item) => item.id !== id));
  }

  clearAttachments(): void {
    this.attachments.set([]);
  }

  onSaveDraft(): void {
    if (this.form.invalid || this.notificationsStore.isSaving()) return;
    const dto = this.#buildNotifyDto();
    const files = this.attachments().map((a) => a.file);
    const current = this.activeNotification();

    if (!current) {
      this.notificationsStore.create({
        projectId: this.projectId(),
        dto,
        attachments: files.length > 0 ? files : undefined,
        onSuccess: (data) => {
          this.attachments.set([]);
          this.isComposing.set(false);
          if (files.length > 0) {
            this.notificationsStore.loadAllAndSelectNotification({
              projectId: this.projectId(),
              filters: this.queryParams(),
              notificationId: data.id
            });
          } else {
            this.notificationsStore.setActiveNotification(data);
          }
        }
      });
      return;
    }

    this.notificationsStore.updateWithAttachments({
      id: current.id,
      dto,
      attachments: files.length > 0 ? files : undefined,
      onSuccess: () => {
        this.attachments.set([]);
        this.isComposing.set(false);
        if (files.length > 0) {
          this.notificationsStore.loadAllAndSelectNotification({
            projectId: this.projectId(),
            filters: this.queryParams(),
            notificationId: current.id
          });
        }
      }
    });
  }

  onSend(): void {
    if (this.form.invalid || this.notificationsStore.isSaving()) return;
    const dto = this.#buildNotifyDto();
    const files = this.attachments().map((a) => a.file);
    const current = this.activeNotification();

    if (!current) {
      this.notificationsStore.createNotifyAndSend({
        projectId: this.projectId(),
        dto,
        attachments: files.length > 0 ? files : undefined,
        onSuccess: () => {
          this.attachments.set([]);
          this.isComposing.set(false);
          if (files.length > 0) {
            const id = this.notificationsStore.activeNotification()?.id;
            if (id) {
              this.notificationsStore.loadAllAndSelectNotification({
                projectId: this.projectId(),
                filters: this.queryParams(),
                notificationId: id
              });
            }
          }
        }
      });
      return;
    }

    this.notificationsStore.updateWithAttachments({
      id: current.id,
      dto,
      attachments: files.length > 0 ? files : undefined,
      onSuccess: () => {
        this.notificationsStore.send({
          notificationId: current.id,
          onSuccess: () => {
            this.attachments.set([]);
            this.isComposing.set(false);
            if (files.length > 0) {
              this.notificationsStore.loadAllAndSelectNotification({
                projectId: this.projectId(),
                filters: this.queryParams(),
                notificationId: current.id
              });
            }
          }
        });
      }
    });
  }

  resendNotification(notification: INotification): void {
    if (this.notificationsStore.isSaving()) return;
    this.notificationsStore.send({
      notificationId: notification.id
    });
  }

  deleteNotification(notification: INotification): void {
    this.#confirmationService.confirm({
      header: 'Supprimer la notification',
      message: `Supprimer « ${notification.title} » ?`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.notificationsStore.delete({ id: notification.id });
      }
    });
  }

  deleteAttachments(notification: INotification): void {
    if (!notification.attachments || notification.attachments.length === 0) return;
    this.#confirmationService.confirm({
      header: 'Supprimer les pièces jointes',
      message: `Supprimer les pièces jointes de « ${notification.title} » ?`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.notificationsStore.deleteAttachments({ id: notification.id });
      }
    });
  }

  isActive(notification: INotification): boolean {
    return this.activeNotification()?.id === notification.id;
  }

  phaseLabel(notification: INotification): string {
    const phaseName = notification.phase?.name;
    return phaseName ? `Phase: ${phaseName}` : 'Tous les participants';
  }

  phaseLabelForSummary(): string {
    const notification = this.activeNotification();
    if (notification) return this.phaseLabel(notification);
    const phaseId = this.form.value.phase_id;
    if (!phaseId) return 'Tous les participants';
    const phase = this.phasesStore.sortedPhases().find((p) => p.id === phaseId);
    return phase ? phase.name : 'Tous les participants';
  }

  detailTitle(notification: INotification | null): string {
    return notification?.title ?? '';
  }

  detailBody(notification: INotification | null): string {
    return notification?.body ?? String(this.form.value.body ?? '');
  }

  bodySafe(notification: INotification | null): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(this.detailBody(notification));
  }

  bodyPlainText(html: string | undefined, maxChars?: number): string {
    if (!html) return '';
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (maxChars != null && text.length > maxChars) return text.slice(0, maxChars) + '…';
    return text;
  }

  attachmentSummary(notification: INotification): string {
    const total = notification.attachments?.length ?? 0;
    if (!total) return 'Aucune pièce jointe';
    return total === 1 ? '1 pièce jointe' : `${total} pièces jointes`;
  }

  senderName(notification: INotification): string {
    return notification.sender?.name || this.authStore.user()?.name || 'Utilisateur';
  }

  senderEmail(notification: INotification): string {
    return notification.sender?.email || this.authStore.user()?.email || '';
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  attachmentUrl(filename: string): string {
    return `${environment.apiUrl}uploads/notifications/${filename}`;
  }

  #buildNotifyDto(): NotifyParticipantsDto {
    const rawPhase = this.form.value.phase_id;
    const phase_id = rawPhase ? String(rawPhase) : undefined;
    return {
      title: String(this.form.value.title ?? ''),
      body: String(this.form.value.body ?? ''),
      ...(phase_id ? { phase_id } : {})
    };
  }
}
