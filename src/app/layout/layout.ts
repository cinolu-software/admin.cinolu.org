import { Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppConfigService } from '@shared/services/config/config.service';
import { AppConfig } from '@shared/services/config/config.types';
import { AdminLayout } from './pages/admin-layout/admin-layout';
import { EmptyLayout } from './pages/empty-layout/empty-layout';
import { LoadingComponent } from '@shared/ui/loading/loading';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  imports: [AdminLayout, EmptyLayout, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Layout implements OnInit, OnDestroy {
  config: AppConfig = {} as AppConfig;
  layout = 'admin-layout';
  #unsubscribeAll = new Subject();
  #activatedRoute = inject(ActivatedRoute);
  #configService = inject(AppConfigService);

  ngOnInit(): void {
    this.#configService.config$.pipe(takeUntil(this.#unsubscribeAll)).subscribe((config) => {
      this.config = config as AppConfig;
      this._updateLayout();
    });
  }

  private _updateLayout(): void {
    let route = this.#activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.layout = this.config.layout;
    const layoutFromQueryParam = route.snapshot.queryParamMap.get('layout');
    if (layoutFromQueryParam) {
      this.layout = layoutFromQueryParam;
      if (this.config) this.config.layout = layoutFromQueryParam;
    }
    const paths = route.pathFromRoot;
    paths.forEach((path) => {
      if (path.routeConfig && path.routeConfig.data && path.routeConfig.data['layout']) {
        this.layout = path.routeConfig.data['layout'];
      }
    });
  }

  ngOnDestroy(): void {
    this.#unsubscribeAll.next(null);
    this.#unsubscribeAll.complete();
  }
}
