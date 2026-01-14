import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Menu,
  ChevronDown,
  LogOut,
  House,
  ExternalLink
} from 'lucide-angular';
import { LINK_GROUPS } from '../../../data/links.data';
import { IUser } from '@shared/models';
import { filter } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { ILinkGroup } from 'src/app/layout/types/link.type';
import { environment } from '@env/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-mobile-nav',
  templateUrl: './mobile-nav.html',
  imports: [LucideAngularModule, RouterModule, NgOptimizedImage]
})
export class MobileNav {
  user = input.required<IUser | null>();
  signOut = output<void>();
  isOpen = signal<boolean>(false);
  icons = { Menu, House, ChevronDown, LogOut, ExternalLink };
  #router = inject(Router);
  style = input<string>();
  currentUrl = signal(this.#router.url);
  toggleTab = signal<string | null>(null);
  closedTab = signal<string | null>(null);
  authStore = inject(AuthStore);
  linkGroups = signal<ILinkGroup[]>(LINK_GROUPS);
  appUrl = environment.appUrl;
  allLinks = computed(() => this.linkGroups().flatMap((group) => group.links));

  activeTab = computed(() => {
    const url = this.currentUrl();
    return (
      this.allLinks().find(
        (link) =>
          link.path === url ||
          link.children?.some((child) => child.path && url.startsWith(child.path))
      )?.name ?? null
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
    return 'mobile-nav-panel-' + name.toLowerCase().replace(/\s+/g, '-');
  }

  toggleNav(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  handleSignOut(): void {
    this.signOut.emit();
  }

  closeNav(): void {
    this.isOpen.set(false);
  }
}
