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
    UiBadge
  ]
})
export class Phases implements OnInit {
  projectId = input.required<string>();
  #confirmationService = inject(ConfirmationService);
  #fb = inject(FormBuilder);
  phasesStore = inject(PhasesStore);
  createForm: FormGroup = this.#buildForm();
  editForm: FormGroup = this.#buildForm();
  editingPhaseId = signal<string | null>(null);
  showCreateForm = signal(false);
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

  #getCurrentForm(): FormGroup {
    return this.editingPhaseId() ? this.editForm : this.createForm;
  }

  get deliverables(): FormArray {
    return this.#getCurrentForm().get('deliverables') as FormArray;
  }

  addDeliverable(deliverable?: PhaseDeliverableDto): void {
    this.deliverables.push(this.#buildDeliverableForm(deliverable));
  }

  removeDeliverable(index: number): void {
    this.deliverables.removeAt(index);
  }

  #setDeliverables(deliverables: PhaseDeliverableDto[] = [], form?: FormGroup): void {
    const targetForm = form || this.#getCurrentForm();
    const deliverableArray = targetForm.get('deliverables') as FormArray;
    deliverableArray.clear();
    for (const deliverable of deliverables) {
      deliverableArray.push(this.#buildDeliverableForm(deliverable));
    }
  }

  #extractMentorIds(phase: IPhase): string[] {
    return (phase.mentors ?? []).map((mentor) => (typeof mentor === 'string' ? mentor : mentor.id));
  }

  #buildPayload(): PhaseDto {
    const formValue = this.#getCurrentForm().getRawValue();
    const deliverables =
      (formValue.deliverables as PhaseDeliverableDto[] | undefined)
        ?.filter((d) => d.title?.length)
        .map((d) => ({
          title: d.title,
          description: d.description || undefined
        })) ?? [];
    const mentors = (formValue.mentors as string[] | undefined)?.filter((m) => m?.length) ?? [];
    return {
      id: formValue.id ?? undefined,
      name: formValue.name,
      description: formValue.description,
      started_at: formValue.started_at,
      ended_at: formValue.ended_at,
      mentors: mentors.length > 0 ? mentors : undefined,
      deliverables: deliverables.length > 0 ? deliverables : undefined
    };
  }

  #resetForm(): void {
    this.editingPhaseId.set(null);
    this.createForm.reset();
    this.createForm.patchValue({ mentors: [] });
    this.#setDeliverables([], this.createForm);
  }

  onCreateClick(): void {
    this.#resetForm();
    this.showCreateForm.set(true);
  }

  onEdit(phase: IPhase): void {
    this.showCreateForm.set(false);
    this.editingPhaseId.set(phase.id);
    this.editForm.reset();
    this.editForm.patchValue({
      ...phase,
      mentors: this.#extractMentorIds(phase),
      started_at: parseDate(phase.started_at),
      ended_at: parseDate(phase.ended_at)
    });
    this.#setDeliverables(
      (phase.deliverables ?? []).map((deliverable) => ({
        title: deliverable.title,
        description: deliverable.description
      })),
      this.editForm
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCancelForm(): void {
    this.showCreateForm.set(false);
    this.#resetForm();
  }

  onSubmit(): void {
    if (this.createForm.invalid) return;
    this.phasesStore.create({
      projectId: this.projectId(),
      dto: this.#buildPayload(),
      onSuccess: () => this.onCancelForm()
    });
  }

  onUpdate(): void {
    const id = this.editForm.getRawValue().id as string | null;
    if (!id || this.editForm.invalid) return;
    this.phasesStore.update({ dto: { ...this.#buildPayload(), id }, onSuccess: () => this.onCancelForm() });
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
