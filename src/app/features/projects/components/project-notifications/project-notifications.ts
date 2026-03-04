import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CircleAlert, Paperclip, Send, Trash2, Pencil, Plus, X, Inbox, LucideAngularModule } from 'lucide-angular';
import {
  UiButton,
  UiInput,
  UiSelect,
  UiTextEditor,
  UiConfirmDialog,
  UiPagination,
  SelectOption,
  UiCheckbox
} from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { INotification } from '@shared/models';
import { NotifyParticipantsDto } from '../../dto/notifications/notify-participants.dto';
import { NotificationsStore } from '../../store/notifications.store';
import { PhasesStore } from '@features/projects/store/phases.store';
import { AuthStore } from '@core/auth/auth.store';
import { environment } from '@env/environment';
import { NotificationStatus } from '@features/projects/types/notification-status.enum';
import { AttachmentPreview } from '@features/projects/types/attachment-preview.type';

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
    UiCheckbox,
    UiConfirmDialog,
    UiPagination,
    LucideAngularModule
  ]
})
export class ProjectNotifications {
  projectId = input.required<string>();
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #sanitizer = inject(DomSanitizer);
  #destroyRef = inject(DestroyRef);
  #defaultFormValue = { title: '', body: '', phase_id: '', notify_mentors: false, notify_staff: false };
  authStore = inject(AuthStore);
  notificationsStore = inject(NotificationsStore);
  phasesStore = inject(PhasesStore);
  form = this.#buildForm();
  attachments = signal<AttachmentPreview[]>([]);
  isComposing = signal(true);
  composeActionLoading = signal<'save' | 'send' | null>(null);
  listActionLoading = signal<'send' | null>(null);
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
  icons = { CircleAlert, Paperclip, Send, Trash2, Pencil, Plus, X, Inbox };
  phaseOptions = computed(() => this.#buildPhaseOptions('Tous les participants'));
  phaseFilterOptions = computed(() => this.#buildPhaseOptions('Toutes les phases'));
  statusFilterOptions: SelectOption[] = [
    { label: 'Tous', value: '' },
    { label: 'Brouillon', value: 'draft' },
    { label: 'Envoyée', value: 'sent' }
  ];
  activeNotification = computed(() => this.notificationsStore.activeNotification());
  statusBadge = computed(() => {
    const notification = this.activeNotification();
    return notification?.status ?? null;
  });

  constructor() {
    this.#setupEffects();
    this.#setupFormListeners();
  }

  #buildForm(): FormGroup {
    return this.#fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      body: ['', [Validators.required, Validators.minLength(10)]],
      phase_id: [''],
      notify_mentors: [false],
      notify_staff: [false]
    });
  }

  #setupEffects(): void {
    effect(() => {
      const projectId = this.projectId();
      if (!projectId) return;
      this.notificationsStore.loadAll({ projectId, filters: this.queryParams() });
      this.phasesStore.loadAll(projectId);
    });

    effect(() => {
      if (this.notificationsStore.isSaving()) return;
      this.composeActionLoading.set(null);
      this.listActionLoading.set(null);
    });
  }

  #setupFormListeners(): void {
    const phaseControl = this.form.get('phase_id');
    const notifyMentorsControl = this.form.get('notify_mentors');
    const notifyStaffControl = this.form.get('notify_staff');
    const bodyControl = this.form.get('body');
    const titleControl = this.form.get('title');
    phaseControl?.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((phaseId) => {
      if (!phaseId && notifyMentorsControl?.value) {
        notifyMentorsControl.setValue(false, { emitEvent: false });
      }
      if (phaseId && notifyStaffControl?.value) {
        notifyStaffControl.setValue(false, { emitEvent: false });
      }
    });
    notifyMentorsControl?.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((notifyMentors) => {
      if (!notifyMentors || !notifyStaffControl?.value) return;
      notifyStaffControl.setValue(false, { emitEvent: false });
    });
    notifyStaffControl?.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((notifyStaff) => {
      if (!notifyStaff) return;
      if (phaseControl?.value) {
        phaseControl.setValue('', { emitEvent: false });
      }
      if (notifyMentorsControl?.value) {
        notifyMentorsControl.setValue(false, { emitEvent: false });
      }
      if (!String(bodyControl?.value ?? '').trim()) {
        bodyControl?.setValue(this.#impactReportTemplate(), { emitEvent: false });
      }
      if (!String(titleControl?.value ?? '').trim()) {
        titleControl?.setValue("Rapport d'impact du projet", { emitEvent: false });
      }
    });
  }

  #buildPhaseOptions(defaultLabel: string): SelectOption[] {
    return [
      { label: defaultLabel, value: '' },
      ...this.phasesStore.sortedPhases().map((phase) => ({ label: phase.name, value: phase.id }))
    ];
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
    this.#startCompose();
  }

  onEditNotification(): void {
    const current = this.activeNotification();
    if (!current) return;
    this.form.patchValue({
      title: current.title,
      body: current.body,
      phase_id: current.phase_id ?? current.phase?.id ?? '',
      notify_mentors: !!current.notify_mentors,
      notify_staff: !!current.notify_staff
    });
    this.notificationsStore.clearError();
    this.#startCompose(false);
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
    const merged = [...this.attachments()];
    files.forEach((file) => {
      const key = this.#attachmentKey(file);
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
    this.composeActionLoading.set('save');
    const dto = this.#buildNotifyDto();
    const files = this.#selectedFiles();
    const hasAttachments = files.length > 0;
    const current = this.activeNotification();

    if (!current) {
      this.notificationsStore.create({
        projectId: this.projectId(),
        dto,
        attachments: hasAttachments ? files : undefined,
        onSuccess: (data) => {
          this.#handleComposeSuccess({
            notificationId: data.id,
            hasAttachments,
            activeNotification: hasAttachments ? undefined : data
          });
        }
      });
      return;
    }

    this.notificationsStore.updateWithAttachments({
      id: current.id,
      dto,
      attachments: hasAttachments ? files : undefined,
      onSuccess: () => this.#handleComposeSuccess({ notificationId: current.id, hasAttachments })
    });
  }

  onSend(): void {
    const current = this.activeNotification();
    if (!current || this.form.invalid || this.notificationsStore.isSaving()) return;
    this.composeActionLoading.set('send');
    const dto = this.#buildNotifyDto();
    const files = this.#selectedFiles();
    const hasAttachments = files.length > 0;

    this.notificationsStore.updateWithAttachments({
      id: current.id,
      dto,
      attachments: hasAttachments ? files : undefined,
      onSuccess: () => {
        this.notificationsStore.send({
          notificationId: current.id,
          onSuccess: () => this.#handleComposeSuccess({ notificationId: current.id, hasAttachments })
        });
      }
    });
  }

  resendNotification(notification: INotification): void {
    if (this.notificationsStore.isSaving()) return;
    this.listActionLoading.set('send');
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

  isActive(notification: INotification): boolean {
    return this.activeNotification()?.id === notification.id;
  }

  phaseLabel(notification: INotification): string {
    if (notification.notify_staff) return "Destinataires: staff (rapport d'impact)";
    if (!notification.phase?.name) return 'Tous les participants';
    return notification.notify_mentors
      ? `Phase: ${notification.phase.name} · mentors uniquement`
      : `Phase: ${notification.phase.name}`;
  }

  bodySafe(notification: INotification | null): SafeHtml {
    const html = notification?.body ?? this.form.value.body ?? '';
    return this.#sanitizer.bypassSecurityTrustHtml(html);
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
    const { phase_id: rawPhase, title, body, notify_mentors, notify_staff } = this.form.value;
    const phase_id = rawPhase ? String(rawPhase) : undefined;
    const isStaffNotification = !!notify_staff;
    return {
      title: String(title ?? ''),
      body: String(body ?? ''),
      ...(isStaffNotification
        ? { notify_staff: true }
        : {
            ...(phase_id && { phase_id, notify_mentors: !!notify_mentors })
          })
    };
  }

  #impactReportTemplate(): string {
    const reportDate = new Date().toLocaleDateString('fr-FR');
    return `
      <h2>Rapport d'impact</h2>
      <p><strong>Date du rapport:</strong> ${reportDate}</p>
      <p><strong>Projet:</strong> [Nom du projet]</p>
      <p><strong>Période couverte:</strong> [Ex: Janvier - Mars 2026]</p>
      <h3>1. Actions réalisées</h3>
      <ul>
        <li>[Action clé 1]</li>
        <li>[Action clé 2]</li>
        <li>[Action clé 3]</li>
      </ul>
      <h3>2. Résultats observés</h3>
      <ul>
        <li>[Indicateur / résultat mesurable]</li>
        <li>[Indicateur / résultat mesurable]</li>
      </ul>
      <h3>3. Impact sur les bénéficiaires</h3>
      <p>[Décrire l'impact concret et les changements observés.]</p>
      <h3>4. Difficultés rencontrées</h3>
      <p>[Décrire les principaux défis et les causes.]</p>
      <h3>5. Besoins d'appui du staff</h3>
      <ul>
        <li>[Besoin prioritaire 1]</li>
        <li>[Besoin prioritaire 2]</li>
      </ul>
      <h3>6. Prochaines étapes</h3>
      <p>[Décrire les activités prévues et l'échéance.]</p>
    `.trim();
  }

  #attachmentKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  #selectedFiles(): File[] {
    return this.attachments().map((a) => a.file);
  }

  #startCompose(resetForm = true): void {
    if (resetForm) this.form.reset(this.#defaultFormValue);
    this.attachments.set([]);
    this.isComposing.set(true);
  }

  #handleComposeSuccess({
    notificationId,
    hasAttachments,
    activeNotification
  }: {
    notificationId: string;
    hasAttachments: boolean;
    activeNotification?: INotification;
  }): void {
    this.attachments.set([]);
    this.isComposing.set(false);
    if (!hasAttachments) {
      if (activeNotification) this.notificationsStore.setActiveNotification(activeNotification);
      return;
    }
    this.notificationsStore.loadAllAndSelectNotification({
      projectId: this.projectId(),
      filters: this.queryParams(),
      notificationId
    });
  }
}
