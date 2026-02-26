import { Component, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronDown, House, ExternalLink } from 'lucide-angular';
import { filter } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LINK_GROUPS } from '../../data/links.data';
import { ILinkGroup } from '../../types/link.type';
import { environment } from '@env/environment';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, LucideAngularModule, NgOptimizedImage],
  templateUrl: './sidebar.html',
  styles: [`
    .sidebar-submenu {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      transform: translateY(-4px);
      transition:
        grid-template-rows 220ms ease,
        opacity 180ms ease,
        transform 180ms ease;
    }

    .sidebar-submenu.is-open {
      grid-template-rows: 1fr;
      opacity: 1;
      transform: translateY(0);
    }

    .sidebar-submenu__inner {
      overflow: hidden;
    }
  `],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
  #router = inject(Router);
  style = input<string>();
  icons = { ChevronDown, House, ExternalLink };
  appUrl = environment.appUrl;
  currentUrl = signal(this.#router.url);
  toggleTab = signal<string | null>(null);
  closedTab = signal<string | null>(null);
  authStore = inject(AuthStore);
  linkGroups = signal<ILinkGroup[]>(LINK_GROUPS);
  allLinks = computed(() => this.linkGroups().flatMap((group) => group.links));

  activeTab = computed(() => {
    const url = this.currentUrl();
    return (
      this.allLinks().find((link) => {
        return (
          link.path === url ||
          link.children?.some((child) => child.path && url.startsWith(child.path))
        );
      })?.name ?? null
    );
  });

  constructor() {
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  onToggleTab(name: string): void {
    const currentlyOpen = this.isTabOpen(name);
    if (currentlyOpen) {
      this.closedTab.set(name);
      this.toggleTab.set(null);
    } else {
      this.closedTab.set(null);
      this.toggleTab.set(name);
    }
  }

  isTabOpen(name: string): boolean {
    if (this.closedTab() === name) return false;
    if (this.toggleTab()) return this.toggleTab() === name;
    return this.activeTab() === name;
  }

  // panelId(name: string): string {
  //   return 'sidebar-panel-' + name.toLowerCase().replace(/\s+/g, '-');
  // }
}
