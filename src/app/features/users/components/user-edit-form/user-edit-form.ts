import { Component, effect, inject, input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IUser } from '@shared/models';
import { parseDate } from '@shared/helpers/form.helper';
import { UsersStore } from '../../store/users.store';
import { RolesStore } from '../../store/roles.store';
import { GENDERS } from '@shared/data/genders.data';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';
import { IRole } from '@shared/models';

@Component({
  selector: 'app-user-edit-form',
  templateUrl: './user-edit-form.html',
  providers: [UsersStore, RolesStore],
  imports: [FormsModule, ReactiveFormsModule, UiSelect, UiMultiSelect, UiInput, UiButton, UiDatepicker, UiTextarea]
})
export class UserEditForm {
  user = input.required<IUser>();
  #fb = inject(FormBuilder);
  store = inject(UsersStore);
  rolesStore = inject(RolesStore);
  genders = GENDERS;
  form = this.#initForm();

  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) return;
      this.#patchForm(user);
      this.rolesStore.loadUnpaginated();
    });
    this.rolesStore.loadUnpaginated();
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      id: ['', Validators.required],
      email: ['', [Validators.required]],
      name: ['', Validators.required],
      phone_number: ['', Validators.required],
      gender: ['', Validators.required],
      city: ['', Validators.required],
      biography: ['', Validators.required],
      country: ['', Validators.required],
      birth_date: ['', Validators.required],
      roles: [[], Validators.required]
    });
  }

  #patchForm(user: IUser): void {
    this.form.patchValue({
      ...user,
      birth_date: user.birth_date ? parseDate(user.birth_date) : '',
      roles: user.roles.map((role: IRole) => role.id)
    });
  }

  onSubmit(): void {
    if (this.form.valid) this.store.update(this.form.value);
  }
}
