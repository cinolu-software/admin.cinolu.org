import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-angular';
import { UiButton, UiDatepicker, UiInput, UiTextarea, UiConfirmDialog, UiBadge } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { IPhase } from '@shared/models';
import { parseDate } from '@shared/helpers/form.helper';
import { PhaseDto } from '../../dto/phases/phase.dto';
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
      ended_at: [null, Validators.required]
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
    if (this.form.invalid) return;
    const body = this.form.value as PhaseDto;
    this.phasesStore.create({ dto: { ...body, id: this.projectId() }, onSuccess: () => this.onCancelForm() });
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
