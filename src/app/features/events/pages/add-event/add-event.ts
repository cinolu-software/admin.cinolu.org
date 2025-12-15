import { Component, computed, effect, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventsStore } from '../../store/events.store';

import { SubprogramsStore } from '@features/programs/store/subprograms.store';
import { UsersStore } from '@features/users/store/users.store';
import { CategoriesStore } from '../../store/event-categories.store';
import { IndicatorsStore } from '@features/programs/store/indicators.store';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect, SelectOption } from '@shared/ui';

@Component({
  selector: 'app-event-add',
  templateUrl: './add-event.html',
  providers: [EventsStore, IndicatorsStore, SubprogramsStore, UsersStore, CategoriesStore],
  imports: [UiSelect, UiMultiSelect, CommonModule, UiButton, UiInput, UiDatepicker, ReactiveFormsModule]
})
export class AddEventComponent {
  #fb = inject(FormBuilder);
  form: FormGroup;
  eventsStore = inject(EventsStore);
  categoriesStore = inject(CategoriesStore);
  programsStore = inject(SubprogramsStore);
  usersStore = inject(UsersStore);

  programOptions = computed<SelectOption[]>(() =>
    this.programsStore.unpaginatedSubprograms().map((prog) => ({
      label: prog.name,
      value: prog.id
    }))
  );

  staffOptions = computed<SelectOption[]>(() =>
    this.usersStore.staff().map((user) => ({
      label: user.email,
      value: user.id
    }))
  );

  categoryOptions = computed<SelectOption[]>(() =>
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
      place: [''],
      context: [''],
      objectives: [''],
      duration_hours: [null],
      selection_criteria: [''],
      started_at: [null, Validators.required],
      ended_at: [null, Validators.required],
      program: ['', Validators.required],
      categories: [[], Validators.required],
      event_manager: ['']
    });
  }

  onAddEvent(): void {
    if (!this.form.valid) return;
    this.eventsStore.addEvent(this.form.value);
  }
}
