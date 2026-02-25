import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-angular';
import {
  SelectOption,
  UiButton,
  UiDatepicker,
  UiInput,
  UiMultiSelect,
  UiTextarea,
  UiConfirmDialog,
  UiBadge
} from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { IPhase } from '@shared/models';
import { parseDate } from '@shared/helpers/form.helper';
import { PhaseDeliverableDto, PhaseDto } from '../../dto/phases/phase.dto';
import { PhasesStore } from '@features/projects/store/phases.store';
import { PhaseSkeleton } from '@features/projects/ui/phase-skeleton/phase-skeleton';

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
    UiMultiSelect,
    UiConfirmDialog,
    LucideAngularModule,
    UiBadge,
    PhaseSkeleton
  ]
})
export class Phases implements OnInit {
  projectId = input.required<string>();
  #confirmationService = inject(ConfirmationService);
  #fb = inject(FormBuilder);
  phasesStore = inject(PhasesStore);
  form = this.#buildForm();
  editingPhaseId = signal<string | null>(null);
  showForm = signal(false);
  icons = { Plus, Pencil, Trash2, Calendar, FileText };
  mentorOptions = computed<SelectOption[]>(() =>
    this.phasesStore.mentors().map((mentor) => ({
      label: mentor.owner.name.toUpperCase(),
      value: mentor.id
    }))
  );
  mentorNameById = computed<Map<string, string>>(
    () => new Map(this.phasesStore.mentors().map((mentor) => [mentor.id, mentor.owner.name]))
  );

  ngOnInit(): void {
    this.phasesStore.loadAll(this.projectId());
    this.phasesStore.loadMentors();
  }

  #buildForm(): FormGroup {
    return this.#fb.group({
      id: [null as string | null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      started_at: [null, Validators.required],
      ended_at: [null, Validators.required],
      mentors: [[]],
      deliverables: this.#fb.array([])
    });
  }

  #buildDeliverableForm(deliverable?: PhaseDeliverableDto): FormGroup {
    return this.#fb.group({
      title: [deliverable?.title ?? '', [Validators.required, Validators.minLength(2)]],
      description: [deliverable?.description ?? undefined]
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

  #setDeliverables(deliverables: PhaseDeliverableDto[]): void {
    this.deliverables.clear();
    deliverables.forEach((deliverable) => this.deliverables.push(this.#buildDeliverableForm(deliverable)));
  }

  #buildPayload(): PhaseDto {
    const formValue = this.form.getRawValue();
    const deliverables = (formValue.deliverables as PhaseDeliverableDto[])
      .filter((d) => d.title?.length)
      .map((d) => ({ title: d.title, description: d.description || undefined }));
    const mentors = (formValue.mentors as string[]).filter((m) => m?.length);
    return {
      id: formValue.id ?? undefined,
      name: formValue.name,
      description: formValue.description,
      started_at: formValue.started_at,
      ended_at: formValue.ended_at,
      mentors: mentors.length ? mentors : undefined,
      deliverables: deliverables.length ? deliverables : undefined
    };
  }

  #resetForm(): void {
    this.editingPhaseId.set(null);
    this.form.reset({ mentors: [] });
    this.deliverables.clear();
  }

  onCreateClick(): void {
    this.#resetForm();
    this.showForm.set(true);
  }

  onEdit(phase: IPhase): void {
    this.showForm.set(false);
    this.editingPhaseId.set(phase.id);
    const mentorIds = (phase.mentors ?? []).map((mentor) => (typeof mentor === 'string' ? mentor : mentor.id));
    this.form.reset({
      ...phase,
      mentors: mentorIds,
      started_at: parseDate(phase.started_at),
      ended_at: parseDate(phase.ended_at)
    });
    this.#setDeliverables((phase.deliverables ?? []).map((d) => ({ title: d.title, description: d.description })));
  }

  onCancelForm(): void {
    this.showForm.set(false);
    this.#resetForm();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const payload = this.#buildPayload();
    if (this.editingPhaseId()) {
      this.phasesStore.update({
        dto: { ...payload, id: this.editingPhaseId()! },
        onSuccess: () => this.onCancelForm()
      });
    } else {
      this.phasesStore.create({
        projectId: this.projectId(),
        dto: payload,
        onSuccess: () => this.onCancelForm()
      });
    }
  }

  onDelete(phase: IPhase): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la phase « ${phase.name} » ?`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.phasesStore.delete(phase.id)
    });
  }

  mentorNamesForPhase(phase: IPhase): string[] {
    const mentorMap = this.mentorNameById();
    return (phase.mentors ?? [])
      .map((mentor) => (typeof mentor === 'string' ? mentorMap.get(mentor) : mentor.name) ?? '')
      .filter(Boolean);
  }

  isEditing(phase: IPhase): boolean {
    return this.editingPhaseId() === phase.id;
  }
}
