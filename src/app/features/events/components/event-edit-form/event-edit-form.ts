import { Component, effect, inject, input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IEvent } from '@shared/models';
import { extractCategoryIds, parseDate } from '@shared/helpers/form.helper';
import { EventsStore } from '../../store/events.store';
import { SubprogramsStore } from '@features/programs/store/subprograms.store';
import { UsersStore } from '@features/users/store/users.store';
import { CategoriesStore } from '../../store/event-categories.store';
import { UiButton, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-event-edit-form',
  templateUrl: './event-edit-form.html',
  providers: [EventsStore, CategoriesStore, UsersStore, SubprogramsStore],
  imports: [FormsModule, ReactiveFormsModule, UiSelect, UiMultiSelect, UiInput, UiButton, UiTextarea]
})
export class EventEditFormComponent {
  event = input.required<IEvent>();
  #fb = inject(FormBuilder);
  store = inject(EventsStore);
  categoriesStore = inject(CategoriesStore);
  programsStore = inject(SubprogramsStore);
  usersStore = inject(UsersStore);
  form = this.#initForm();

  constructor() {
    effect(() => {
      const event = this.event();
      if (!event) return;
      this.#patchForm(event);
      this.programsStore.loadAllSubprograms();
    });
    this.categoriesStore.loadUnpaginatedCategories();
    this.usersStore.loadStaff();
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      place: [''],
      description: ['', Validators.required],
      context: [''],
      objectives: [''],
      duration_hours: [null],
      selection_criteria: [''],
      started_at: ['', Validators.required],
      ended_at: ['', Validators.required],
      program: ['', Validators.required],
      categories: [[], Validators.required],
      event_manager: ['']
    });
  }

  #patchForm(event: IEvent): void {
    this.form.patchValue({
      ...event,
      started_at: parseDate(event.started_at),
      ended_at: parseDate(event.ended_at),
      program: event.program.id,
      categories: extractCategoryIds(event.categories),
      event_manager: event.event_manager?.id ?? ''
    });
  }

  onSubmit(): void {
    if (this.form.valid) this.store.updateEvent(this.form.value);
  }
}
