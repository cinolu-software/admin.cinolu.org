import { Component, inject, input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';
import { ICategory, IProject, ISubprogram, IUser } from '@shared/models';
import { extractCategoryIds, parseDate } from '@shared/helpers/form.helper';
import { ProjectsStore } from '../../store/projects.store';

@Component({
  selector: 'app-project-update',
  templateUrl: './project-update.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectsStore],
  imports: [FormsModule, ReactiveFormsModule, UiInput, UiTextarea, UiSelect, UiMultiSelect, UiDatepicker, UiButton]
})
export class ProjectUpdate implements OnInit {
  project = input.required<IProject>();
  programs = input.required<ISubprogram[]>();
  staff = input.required<IUser[]>();
  categories = input.required<ICategory[]>();
  #fb = inject(FormBuilder);
  updateProjectStore = inject(ProjectsStore);
  form = this.#initForm();

  ngOnInit(): void {
    this.#patchForm(this.project());
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      id: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      context: [''],
      objectives: [''],
      duration_hours: [null, Validators.required],
      selection_criteria: [''],
      started_at: ['', Validators.required],
      ended_at: ['', Validators.required],
      program: ['', Validators.required],
      categories: [[], Validators.required],
      project_manager: [null]
    });
  }

  #patchForm(project: IProject): void {
    this.form.patchValue({
      ...project,
      started_at: parseDate(project.started_at),
      ended_at: parseDate(project.ended_at),
      program: project.program.id,
      categories: extractCategoryIds(project.categories),
      project_manager: project.project_manager?.id || null
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.updateProjectStore.update({
      ...this.form.value,
      duration_hours: Number(this.form.value.duration_hours)
    });
  }
}
