import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectsStore } from '../../store/projects.store';
import { CategoriesStore } from '../../store/project-categories.store';
import { SubprogramsStore } from '../../../programs/store/subprograms.store';
import { UsersStore } from '@features/users/store/users.store';
import { IndicatorsStore } from '@features/programs/store/indicators.store';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-project-add',
  templateUrl: './add-project.html',
  providers: [ProjectsStore, IndicatorsStore, SubprogramsStore, CategoriesStore, UsersStore],
  imports: [UiSelect, UiInput, UiMultiSelect, UiButton, UiDatepicker, UiTextarea, ReactiveFormsModule]
})
export class AddProjectComponent {
  #fb = inject(FormBuilder);
  form: FormGroup;
  store = inject(ProjectsStore);
  categoriesStore = inject(CategoriesStore);
  programsStore = inject(SubprogramsStore);
  usersStore = inject(UsersStore);

  programOptions = computed(() =>
    this.programsStore.unpaginatedSubprograms().map((program) => ({
      label: program.name,
      value: program.id
    }))
  );

  staffOptions = computed(() =>
    this.usersStore.staff().map((user) => ({
      label: user.name || user.email,
      value: user.id
    }))
  );

  categoryOptions = computed(() =>
    this.categoriesStore.allCategories().map((cat) => ({
      label: cat.name,
      value: cat.id
    }))
  );

  constructor() {
    effect(() => {
      this.programsStore.loadAllSubprograms();
    });
    this.form = this.#initForm();
    this.categoriesStore.loadUnpaginatedCategories();
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
      project_manager: ['']
    });
  }

  onAddProject(): void {
    if (!this.form.valid) return;
    this.store.addProject(this.form.value);
  }
}
