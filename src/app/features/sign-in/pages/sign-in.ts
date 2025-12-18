import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { UiInput, UiPassword, UiButton } from '@ui';
import { SignInStore } from '../store/sign-in.store';
import { AuthStore } from '@core/auth/auth.store';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.html',
  providers: [SignInStore],
  imports: [ReactiveFormsModule, NgOptimizedImage, UiInput, UiPassword, UiButton]
})
export class SignIn {
  #formBuilder: FormBuilder = inject(FormBuilder);
  form: FormGroup;
  store = inject(SignInStore);
  authStore = inject(AuthStore);

  constructor() {
    this.form = this.#formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSignIn(): void {
    if (this.form.invalid) return;
    this.store.signIn({
      payload: this.form.value,
      onSuccess: () => true
    });
  }
}
