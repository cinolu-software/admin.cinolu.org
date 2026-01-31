import { Component, Input, inject, signal } from '@angular/core';
import { LucideAngularModule, Pencil, Trash, Eye, Star, Search, Funnel, Plus } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubprogramsStore } from '../../store/subprograms.store';
import { ISubprogram } from '@shared/models';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { IProgram } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { UiButton, UiInput, UiConfirmDialog, FileUpload, UiAvatar, UiTextarea, UiBadge } from '@ui';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-list-subprograms',
  templateUrl: './subprograms.html',
  providers: [SubprogramsStore],
  imports: [
    LucideAngularModule,
    DatePipe,
    UiButton,
    UiInput,
    ReactiveFormsModule,
    UiConfirmDialog,
    FileUpload,
    ApiImgPipe,
    UiAvatar,
    UiTableSkeleton,
    UiTextarea,
    UiButton,
    UiBadge
  ]
})
export class ListSubprograms {
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  store = inject(SubprogramsStore);

  @Input({ required: true })
  set program(value: IProgram | null) {
    this.programSignal.set(value);
    const programId = value?.id || '';
    this.createForm.patchValue({ programId });
    if (programId) {
      this.loadAll(programId);
    }
  }

  programSignal = signal<IProgram | null>(null);
  createForm: FormGroup = this.#fb.group({
    programId: ['', Validators.required],
    name: ['', Validators.required],
    description: ['', Validators.required]
  });
  updateForm: FormGroup = this.#fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required]
  });
  icons = { Pencil, Plus, Trash, Eye, Star, Search, Funnel };
  isCreating = signal(false);
  editingSubprogramId = signal<string | null>(null);

  loadAll(programId?: string): void {
    const id = programId ?? this.programSignal()?.id;
    if (!id) return;
    this.store.loadAll(id);
  }

  onShowcase(): void {
    const subprogram = this.getEditingSubprogram();
    if (!subprogram) return;
    this.store.showcase(subprogram.id);
  }

  onPublishProgram(): void {
    const subprogram = this.getEditingSubprogram();
    if (!subprogram) return;
    this.store.publish(subprogram.id);
  }

  onFileUploadLoaded(): void {
    this.loadAll();
  }

  onToggleCreation(): void {
    this.isCreating.update((visible) => !visible);
    if (!this.isCreating()) {
      this.createForm.reset({
        programId: this.programSignal()?.id || '',
        name: '',
        description: ''
      });
    }
  }

  onCancelCreation(): void {
    this.isCreating.set(false);
    this.createForm.reset({
      programId: this.programSignal()?.id || '',
      name: '',
      description: ''
    });
  }

  onCreate(): void {
    if (this.createForm.invalid) return;
    const payload = this.createForm.getRawValue();
    if (!payload.programId) {
      payload.programId = this.programSignal()?.id || '';
    }
    this.store.create({
      payload,
      onSuccess: () => {
        this.onCancelCreation();
        this.loadAll();
      }
    });
  }

  onEdit(subprogram: ISubprogram): void {
    this.editingSubprogramId.set(subprogram.id);
    this.updateForm.patchValue({
      name: subprogram.name,
      description: subprogram.description
    });
  }

  onCancelUpdate(): void {
    this.editingSubprogramId.set(null);
    this.updateForm.reset({
      name: '',
      description: ''
    });
  }

  onUpdate(): void {
    if (this.updateForm.invalid) return;
    const payload = this.updateForm.getRawValue();
    const subprogramId = this.editingSubprogramId();
    if (!subprogramId) return;
    this.store.update({
      payload: {
        id: subprogramId,
        programId: this.programSignal()?.id || '',
        ...payload
      },
      onSuccess: () => {
        this.onCancelUpdate();
        this.loadAll();
      }
    });
  }

  isEditing(subprogramId: string): boolean {
    return this.editingSubprogramId() === subprogramId;
  }

  getEditingSubprogram(): ISubprogram | null {
    const id = this.editingSubprogramId();
    if (!id) return null;
    return this.store.allSubprograms().find((sp) => sp.id === id) || null;
  }

  onDelete(subprogramId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer ce sous-programme ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(subprogramId);
        this.loadAll();
      }
    });
  }
}
