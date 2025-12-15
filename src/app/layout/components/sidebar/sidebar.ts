import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronDown, House } from 'lucide-angular';
import { filter } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LINKS } from '../../data/links.data';
import { ILink } from '../../types/link.type';
import { environment } from '@env/environment';

@Component({
  selector: 'app-sidebar',
  imports: [ RouterModule, LucideAngularModule],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  #router = inject(Router);
  style = input<string>();
  icons = { ChevronDown, House };
  appUrl = environment.appUrl;
  currentUrl = signal(this.#router.url);
  toggleTab = signal<string | null>(null);
  closedTab = signal<string | null>(null);
  authStore = inject(AuthStore);
  links = signal<ILink[]>(LINKS);
  activeTab = computed(() => {
    const url = this.currentUrl();
    return (
      this.links().find((link) => {
        return link.path === url || link.children?.some((child) => child.path && url.startsWith(child.path));
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

  panelId(name: string): string {
    return 'sidebar-panel-' + name.toLowerCase().replace(/\s+/g, '-');
  }
}
