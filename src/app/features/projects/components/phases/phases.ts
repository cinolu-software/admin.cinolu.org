import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-angular';
import { UiButton, UiDatepicker, UiInput, UiTextarea, UiConfirmDialog, UiBadge } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { IPhase, IProject } from '@shared/models';
import { parseDate } from '@shared/helpers/form.helper';
import { PhaseDto } from '../../dto/phases/phase.dto';
import { PhasesStore } from '@features/projects/store/phases.store';

@Component({
  selector: 'app-phases',
  templateUrl: './phases.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class Phases {
  project = input.required<IProject | null>();
  phasesChange = output<IPhase[]>();
  #confirmationService = inject(ConfirmationService);
  #fb = inject(FormBuilder);
  phasesStore = inject(PhasesStore);
  form: FormGroup = this.#buildForm();
  editingPhaseId = signal<string | null>(null);
  showCreateForm = signal(false);
  icons = { Plus, Pencil, Trash2, Calendar, FileText };

  constructor() {
    effect(() => {
      const proj = this.project();
      if (proj?.phases) {
        this.phasesStore.setPhases([...proj.phases]);
      } else {
        this.phasesStore.setPhases([]);
      }
    });
  }

  #buildForm(): FormGroup {
    return this.#fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      started_at: [null as Date | null, Validators.required],
      ended_at: [null as Date | null, Validators.required]
    });
  }

  onCreateClick(): void {
    this.editingPhaseId.set(null);
    this.form.reset();
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
  }

  onCancelForm(): void {
    this.showCreateForm.set(false);
    this.editingPhaseId.set(null);
    this.form.reset();
  }

  onSubmit(): void {
    const proj = this.project();
    if (!proj?.id || this.form.invalid) return;
    const body = this.form.value as PhaseDto;
    this.phasesStore.create({ dto: { ...body, id: proj.id }, onSuccess: () => this.onCancelForm() });
  }

  onUpdate(): void {
    const id = this.editingPhaseId();
    if (!id || this.form.invalid) return;
    const body = this.form.value as PhaseDto;
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
