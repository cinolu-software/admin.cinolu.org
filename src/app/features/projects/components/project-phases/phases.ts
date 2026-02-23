import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-angular';
import { UiButton, UiDatepicker, UiInput, UiTextarea, UiConfirmDialog, UiBadge } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { IPhase } from '@shared/models';
import { parseDate } from '@shared/helpers/form.helper';
import { PhaseDeliverableDto, PhaseDto } from '../../dto/phases/phase.dto';
import { PhasesStore } from '@features/projects/store/phases.store';

@Component({
  selector: 'app-phases',
  templateUrl: './phases.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PhasesStore],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiTextarea,
    UiDatepicker,
    UiConfirmDialog,
    LucideAngularModule,
    UiBadge
  ]
})
export class Phases implements OnInit {
  projectId = input.required<string>();
  #confirmationService = inject(ConfirmationService);
  #fb = inject(FormBuilder);
  phasesStore = inject(PhasesStore);
  form: FormGroup = this.#buildForm();
  editingPhaseId = signal<string | null>(null);
  showCreateForm = signal(false);
  icons = { Plus, Pencil, Trash2, Calendar, FileText };

  ngOnInit(): void {
    this.phasesStore.loadAll(this.projectId());
  }

  #buildForm(): FormGroup {
    return this.#fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      started_at: [null, Validators.required],
      ended_at: [null, Validators.required],
      deliverables: this.#fb.array([])
    });
  }

  #buildDeliverableForm(deliverable?: PhaseDeliverableDto): FormGroup {
    return this.#fb.group({
      title: [deliverable?.title ?? '', [Validators.required, Validators.minLength(2)]],
      description: [deliverable?.description ?? '']
    });
  }

  get deliverables(): FormArray {
    return this.form.get('deliverables') as FormArray;
  }

  addDeliverable(deliverable?: PhaseDeliverableDto): void {
    this.deliverables.push(this.#buildDeliverableForm(deliverable));
  }

  removeDeliverable(index: number): void {
    this.deliverables.removeAt(index);
  }

  #setDeliverables(deliverables: PhaseDeliverableDto[] = []): void {
    this.deliverables.clear();
    for (const deliverable of deliverables) {
      this.addDeliverable(deliverable);
    }
  }

  #buildPayload(): PhaseDto {
    const formValue = this.form.getRawValue();
    const deliverables =
      (formValue.deliverables as PhaseDeliverableDto[] | null | undefined)
        ?.map((deliverable) => ({
          title: deliverable.title?.trim() ?? '',
          description: deliverable.description?.trim() || undefined
        }))
        .filter((deliverable) => deliverable.title.length > 0) ?? [];

    return {
      name: formValue.name,
      description: formValue.description,
      started_at: formValue.started_at,
      ended_at: formValue.ended_at,
      deliverables: deliverables.length > 0 ? deliverables : undefined
    };
  }

  onCreateClick(): void {
    this.editingPhaseId.set(null);
    this.form.reset();
    this.#setDeliverables();
    this.showCreateForm.set(true);
  }

  onEdit(phase: IPhase): void {
    this.showCreateForm.set(false);
    this.editingPhaseId.set(phase.id);
    this.form.patchValue({
      ...phase,
      started_at: parseDate(phase.started_at),
      ended_at: parseDate(phase.ended_at)
    });
    this.#setDeliverables(
      (phase.deliverables ?? []).map((deliverable) => ({
        title: deliverable.title,
        description: deliverable.description
      }))
    );
  }

  onCancelForm(): void {
    this.showCreateForm.set(false);
    this.editingPhaseId.set(null);
    this.form.reset();
    this.#setDeliverables();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const body = this.#buildPayload();
    this.phasesStore.create({ dto: { ...body, id: this.projectId() }, onSuccess: () => this.onCancelForm() });
  }

  onUpdate(): void {
    const id = this.editingPhaseId();
    if (!id || this.form.invalid) return;
    const body = this.#buildPayload();
    this.phasesStore.update({ dto: { ...body, id }, onSuccess: () => this.onCancelForm() });
  }

  onDelete(phase: IPhase): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la phase « ${phase.name} » ?`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.phasesStore.delete(phase.id);
      }
    });
  }

  isEditing(phase: IPhase): boolean {
    return this.editingPhaseId() === phase.id;
  }
}
