import { Component, effect, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthStore } from '@core/auth';
import { environment } from '@env/environment';
import { UpdateInfoStore } from '@features/account/store/update-info.store';
import { UpdatePasswordStore } from '@features/account/store/update-password.store';
import { GENDERS } from '@shared/data';
import { UiInput, UiDatepicker, UiTextarea, UiSelect, UiButton, FileUpload } from '@ui';

@Component({
  selector: 'app-account-update',
  templateUrl: './account-update.html',
  providers: [UpdateInfoStore, UpdatePasswordStore],
  imports: [ReactiveFormsModule, UiInput, UiDatepicker, UiTextarea, UiSelect, UiButton, FileUpload]
})
export class AccountUpdate {
  #fb = inject(FormBuilder);
  infoStore = inject(UpdateInfoStore);
  passwordStore = inject(UpdatePasswordStore);
  authStore = inject(AuthStore);
  url = environment.apiUrl + 'users/image-profile';
  genderOptions = GENDERS;
  infoForm: FormGroup = this.#initInfoForm();
  passwordForm: FormGroup = this.#initPasswordForm();

  constructor() {
    effect(() => {
      const user = this.authStore.user();
      if (!user) return;
      this.infoForm.patchValue({
        ...user,
        birth_date: user.birth_date && new Date(user.birth_date)
      });
    });
  }

  #initInfoForm(): FormGroup {
    return this.#fb.group({
      email: ['', Validators.email],
      city: ['', Validators.required],
      country: ['', Validators.required],
      biography: [''],
      gender: ['', Validators.required],
      birth_date: ['', Validators.required],
      phone_number: ['', [Validators.minLength(10)]],
      name: ['', Validators.minLength(3)]
    });
  }

  #initPasswordForm(): FormGroup {
    return this.#fb.group({
      password: ['', [Validators.minLength(6), Validators.required]],
      password_confirm: ['', [Validators.minLength(6), Validators.required]]
    });
  }

  onLoaded(): void {
    this.authStore.getProfile();
  }

  onUpdateInfo(): void {
    if (!this.infoForm.valid) return;
    this.infoStore.updateInfo(this.infoForm.value);
  }

  onUpdatePassword(): void {
    if (!this.passwordForm.valid) return;
    this.passwordStore.updatePassword(this.passwordForm.value);
  }
}
