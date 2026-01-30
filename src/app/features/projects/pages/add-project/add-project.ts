import { Component, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectsStore } from '../../store/projects.store';
import { CategoriesStore } from '../../store/project-categories.store';
import { SubprogramsStore } from '../../../programs/store/subprograms.store';
import { UsersStore } from '@features/users/store/users.store';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-project-add',
  templateUrl: './add-project.html',
  providers: [ProjectsStore, SubprogramsStore, CategoriesStore, UsersStore],
  imports: [UiSelect, UiInput, UiMultiSelect, UiButton, UiDatepicker, UiTextarea, ReactiveFormsModule]
})
export class AddProjectComponent {
  #fb = inject(FormBuilder);
  form: FormGroup = this.#initForm();
  store = inject(ProjectsStore);
  categoriesStore = inject(CategoriesStore);
  programsStore = inject(SubprogramsStore);
  usersStore = inject(UsersStore);

  constructor() {
    effect(() => {
      this.programsStore.loadUnpaginated();
    });
    this.categoriesStore.loadUnpaginated();
    this.usersStore.loadStaff();
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      context: [''],
      objectives: [''],
      duration_hours: [null],
      selection_criteria: [''],
      started_at: [null, Validators.required],
      ended_at: [null, Validators.required],
      program: ['', Validators.required],
      categories: [[], Validators.required],
      project_manager: ['', Validators.required]
    });
  }

  onAddProject(): void {
    if (!this.form.valid) return;
    this.store.create(this.form.value);
  }
}
