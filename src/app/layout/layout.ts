import { Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AppConfigService } from '@shared/services/config/config.service';
import { AppConfig } from '@shared/services/config/config.types';
import { SidebarLayout } from './pages/sidebar-layout/sidebar-layout';
import { EmptyLayout } from './pages/empty-layout/empty-layout';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  imports: [SidebarLayout, EmptyLayout],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Layout implements OnInit, OnDestroy {
  config: AppConfig = {} as AppConfig;
  layout = 'sidebar-layout';
  #unsubscribeAll = new Subject();
  #router = inject(Router);
  #activatedRoute = inject(ActivatedRoute);
  #configService = inject(AppConfigService);

  ngOnInit(): void {
    this.#configService.config$.pipe(takeUntil(this.#unsubscribeAll)).subscribe((config) => {
      this.config = config as AppConfig;
      this._updateLayout();
    });
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.#unsubscribeAll)
      )
      .subscribe(() => {
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
