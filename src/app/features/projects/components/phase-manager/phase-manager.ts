import { ChangeDetectionStrategy, Component, inject, input, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-angular';
import { PhasesStore } from '../../store/phases.store';
import { UiButton, UiDatepicker, UiInput, UiTextarea, UiConfirmDialog } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { IPhase } from '@shared/models';
import { parseDate } from '@shared/helpers/form.helper';

@Component({
  selector: 'app-phase-manager',
  templateUrl: './phase-manager.html',
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
    LucideAngularModule
  ]
})
export class PhaseManager implements OnInit {
  projectId = input.required<string>();
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  store = inject(PhasesStore);
  form: FormGroup = this.#buildForm();
  editingPhaseId = signal<string | null>(null);
  showCreateForm = signal(false);
  icons = { Plus, Pencil, Trash2, Calendar, FileText };
  sortedPhases = computed(() =>
    this.store.phases().sort((a, b) => parseDate(a.started_at).getTime() - parseDate(b.started_at).getTime())
  );

  ngOnInit(): void {
    this.store.loadByProject(this.projectId());
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
    this.form.reset({
      name: '',
      description: '',
      started_at: null,
      ended_at: null
    });
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
    this.store.create({ ...this.form.value, id: this.projectId() });
    this.onCancelForm();
  }

  onUpdate(): void {
    this.store.update({ ...this.form.value, id: this.editingPhaseId() });
    this.onCancelForm();
  }

  onDelete(phase: IPhase): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la phase « ${phase.name} » ?`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.store.delete(phase.id)
    });
  }

  isEditing(phase: IPhase): boolean {
    return this.editingPhaseId() === phase.id;
  }
}
