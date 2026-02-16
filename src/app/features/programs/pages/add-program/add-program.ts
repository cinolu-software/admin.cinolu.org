import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, CircleAlert } from 'lucide-angular';
import { ProgramsStore } from '../../store/programs.store';
import { ProgramDto } from '../../dto/programs/program.dto';
import { CategoriesStore } from '@features/projects/store/project-categories.store';
import { UiButton, UiInput, UiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-add-program',
  providers: [ProgramsStore, CategoriesStore],
  imports: [ReactiveFormsModule, UiButton, UiInput, UiSelect, UiTextarea, LucideAngularModule],
  templateUrl: './add-program.html',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProgramPage {
  #fb = inject(FormBuilder);
  store = inject(ProgramsStore);
  categoriesStore = inject(CategoriesStore);
  icons = { alert: CircleAlert };
  form = this.#fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.store.create(this.form.value as ProgramDto);
  }

  constructor() {
    this.categoriesStore.loadUnpaginated();
  }
}
