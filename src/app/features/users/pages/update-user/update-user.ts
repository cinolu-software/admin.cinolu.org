import { Component, computed, effect, inject } from '@angular/core';
import { LucideAngularModule, Locate, TriangleAlert, Phone, Mail, User, Calendar, MapPin } from 'lucide-angular';
import { CommonModule, Location, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersStore } from '../../store/users.store';
import { RolesStore } from '../../store/roles.store';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { GENDERS } from '@shared/data/genders.data';
import { ActivatedRoute } from '@angular/router';
import { IRole } from '@shared/models';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiSelect } from '@shared/ui';

@Component({
  selector: 'app-user-update',
  templateUrl: './update-user.html',
  providers: [UsersStore, RolesStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiButton,
    UiInput,
    ReactiveFormsModule,
    NgOptimizedImage,
    ApiImgPipe,
    UiDatepicker,
    UiMultiSelect,
    UiSelect
  ]
})
export class UpdateUser {
  #fb = inject(FormBuilder);
  #location = inject(Location);
  genders = GENDERS;
  updateUserForm: FormGroup;
  store = inject(UsersStore);
  rolesStore = inject(RolesStore);
  #route = inject(ActivatedRoute);

  roleOptions = computed(() =>
    this.rolesStore.allRoles().map((role) => ({
      label: role.name,
      value: role.id
    }))
  );

  icons = {
    locate: Locate,
    alert: TriangleAlert,
    phone: Phone,
    email: Mail,
    user: User,
    calendar: Calendar,
    mapPin: MapPin
  };

  constructor() {
    this.updateUserForm = this.#fb.group({
      id: ['', Validators.required],
      email: ['', [Validators.required]],
      name: ['', Validators.required],
      phone_number: ['', Validators.required],
      gender: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      birth_date: ['', Validators.required],
      roles: [[], Validators.required]
    });
    const email = this.#route.snapshot.params['email'];
    if (email) this.store.loadOne(email);
    this.rolesStore.loadUnpaginated();
    effect(() => {
      const user = this.store.user();
      if (!user) return;
      this.updateUserForm.patchValue({
        ...user,
        birth_date: user.birth_date ? new Date(user.birth_date) : '',
        roles: user.roles.map((role: IRole) => role.id)
      });
    });
  }

  onUpdateUser(): void {
    this.store.update(this.updateUserForm.value);
  }

  onGoBack(): void {
    this.#location.back();
  }
}
