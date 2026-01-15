import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  #counter = signal(0);
  readonly isLoading = computed(() => this.#counter() > 0);

  show(): void {
    this.#counter.update((c) => c + 1);
  }

  hide(): void {
    this.#counter.update((c) => Math.max(0, c - 1));
  }

  reset(): void {
    this.#counter.set(0);
  }
}
