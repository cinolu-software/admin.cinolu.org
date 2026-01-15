import { Component, ChangeDetectionStrategy, inject, signal, afterNextRender } from '@angular/core';
import { LoadingService } from '@shared/services/loading/loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent {
  readonly #loadingService = inject(LoadingService);
  isBrowser = signal<boolean>(false);

  constructor() {
    afterNextRender(() => {
      this.isBrowser.set(true);
    });
  }

  get isLoading(): boolean {
    return this.#loadingService.isLoading();
  }
}
