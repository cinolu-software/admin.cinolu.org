import { Component, inject, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersStore } from '../../store/users.store';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GENDERS } from '@shared/data';
import { RolesStore } from '@features/users/store/roles.store';
import { parseDate } from '@shared/helpers';
import { IUser, IRole } from '@shared/models';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@ui';

@Component({
  selector: 'app-user-update',
  templateUrl: './update-user.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore, RolesStore],
  imports: [UiInput, UiButton, UiSelect, UiDatepicker, UiTextarea, UiMultiSelect, ReactiveFormsModule]
})
export class UpdateUser implements OnInit {
  #route = inject(ActivatedRoute);
  #email = this.#route.snapshot.params['email'];
  usersStore = inject(UsersStore);
  #fb = inject(FormBuilder);
  store = inject(UsersStore);
  rolesStore = inject(RolesStore);
  genders = GENDERS;
  form = this.#initForm();

  ngOnInit(): void {
    this.usersStore.loadOne(this.#email);
    this.rolesStore.loadUnpaginated();
  }

  constructor() {
    this.form = this.#initForm();
    effect(() => {
      const user = this.usersStore.user();
      if (user) this.#patchForm(user);
    });
  }

  #initForm(): FormGroup {
    return this.#fb.group({
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
      birth_date: parseDate(user.birth_date),
      roles: user?.roles?.map((role: IRole) => role.id) || []
    });
  }

  onSubmit(): void {
    if (this.form.valid) this.store.update(this.form.value);
  }
}
