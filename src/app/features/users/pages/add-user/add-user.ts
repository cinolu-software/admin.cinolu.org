import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersStore } from '../../store/users.store';
import { RolesStore } from '../../store/roles.store';
import { GENDERS } from '@shared/data/genders.data';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect } from '@shared/ui';

@Component({
  selector: 'app-user-add',
  templateUrl: './add-user.html',
  providers: [UsersStore, RolesStore],
  imports: [CommonModule, UiButton, UiInput, ReactiveFormsModule, UiDatepicker, UiMultiSelect, UiSelect]
})
export class AddUserComponent {
  #fb = inject(FormBuilder);
  addUserForm: FormGroup;
  store = inject(UsersStore);
  rolesStore = inject(RolesStore);
  genders = GENDERS;

  roleOptions = computed(() =>
    this.rolesStore.allRoles().map((role) => ({
      label: role.name,
      value: role.id
    }))
  );

  constructor() {
    this.addUserForm = this.#fb.group({
      email: ['', [Validators.required]],
      name: ['', Validators.required],
      gender: ['', Validators.required],
      phone_number: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      birth_date: ['', Validators.required],
      roles: [[], Validators.required]
    });
    this.rolesStore.loadUnpaginated();
  }

  onAddUser(): void {
    this.store.create(this.addUserForm.value);
  }
}
