import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  #route = inject(ActivatedRoute);
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
    const redirectPath = this.#route.snapshot.queryParamMap.get('redirect');
    this.store.signIn({
      payload: this.form.value,
      redirectPath: redirectPath || '/dashboard',
      onSuccess: () => true
    });
  }
}
