import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '@core/auth/auth.store';

@Component({
  selector: 'app-auth-checking',
  templateUrl: './auth-checking.html'
})
export class AuthCheckingComponent {
  readonly #authStore = inject(AuthStore);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  get isChecking(): boolean {
    return this.#isBrowser && this.#authStore.isChecking();
  }
}
