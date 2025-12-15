import { Component, Input, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  SquarePen,
  Trash,
  Plus,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Search,
  Funnel
} from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubprogramsStore } from '../../store/subprograms.store';
import { ISubprogram } from '@shared/models';
import { environment } from '@env/environment';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { IProgram } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { UiButton, UiInput, UiConfirmDialog, FileUpload, UiAvatar, UiTextarea, UiBadge } from '@ui';

@Component({
  selector: 'app-list-subprograms',
  templateUrl: './subprograms.html',
  providers: [SubprogramsStore],
  imports: [
    LucideAngularModule,
    CommonModule,
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
    this.subprogramForm.patchValue({ programId });
    if (programId) {
      this.loadSubprograms(programId);
    }
  }

  programSignal = signal<IProgram | null>(null);
  subprogramForm: FormGroup = this.#fb.group({
    id: [''],
    programId: ['', Validators.required],
    name: ['', Validators.required],
    description: ['', Validators.required]
  });
  url = environment.apiUrl + 'subprograms/logo/';
  icons = {
    Pencil: SquarePen,
    Trash: Trash,
    Plus: Plus,
    Eye: Eye,
    EyeOff: EyeOff,
    Star: Star,
    StarOff: StarOff,
    Search: Search,
    Funnel: Funnel
  };
  formVisible = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editingSubprogram = signal<ISubprogram | null>(null);

  highlightSubprogram(id: string): void {
    this.store.highlightSubprogram(id);
  }

  loadSubprograms(programId?: string): void {
    const id = programId ?? this.programSignal()?.id;
    if (!id) return;
    this.store.loadUnpaginatedSubprograms(id);
  }

  onPublishProgram(id: string): void {
    this.store.publishSubprogram(id);
  }

  onFileUploadLoaded(): void {
    this.loadSubprograms();
  }

  onToggleForm(subprogram: ISubprogram | null = null): void {
    if (subprogram) {
      this.formMode.set('edit');
      this.editingSubprogram.set(subprogram);
      this.subprogramForm.patchValue({
        id: subprogram.id,
        programId: subprogram.program?.id || this.programSignal()?.id || '',
        name: subprogram.name,
        description: subprogram.description
      });
      this.formVisible.set(true);
      return;
    }
    this.formMode.set('create');
    this.editingSubprogram.set(null);
    this.subprogramForm.reset({
      id: '',
      programId: this.programSignal()?.id || '',
      name: '',
      description: ''
    });
    this.formVisible.update((visible) => !visible);
  }

  onCancelForm(): void {
    this.formVisible.set(false);
    this.formMode.set('create');
    this.editingSubprogram.set(null);
    this.subprogramForm.reset({
      id: '',
      programId: this.programSignal()?.id || '',
      name: '',
      description: ''
    });
  }

  onSubmit(): void {
    if (this.subprogramForm.invalid) return;
    const payload = this.subprogramForm.getRawValue();
    if (!payload.programId) {
      payload.programId = this.programSignal()?.id || '';
    }
    if (this.formMode() === 'edit') {
      this.store.updateSubprogram({
        payload,
        onSuccess: () => {
          this.onCancelForm();
          this.loadSubprograms();
        }
      });
      return;
    }
    this.store.addSubprogram({
      payload,
      onSuccess: () => {
        this.onCancelForm();
        this.loadSubprograms();
      }
    });
  }

  onDelete(subprogramId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer ce sous-programme ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.deleteSubprogram(subprogramId);
        this.loadSubprograms();
      }
    });
  }
}
