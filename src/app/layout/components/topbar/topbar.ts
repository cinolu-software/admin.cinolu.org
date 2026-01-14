import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { DesktopNav } from './desktop-menu/desktop-nav';
import { MobileNav } from './mobile-menu/mobile-nav';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { Calendar, LucideAngularModule } from 'lucide-angular';
// import { LINKS } from '../../data/links.data';

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, RouterLink, NgOptimizedImage, DesktopNav, MobileNav, LucideAngularModule],
  templateUrl: './topbar.html'
})
export class Topbar implements OnDestroy {
  #elementRef = inject(ElementRef);
  isFixed = signal(false);
  // links = signal(Link);
  fixed = input(false);
  mobileNav = viewChild(MobileNav);
  desktopNav = viewChild(DesktopNav);
  #destroy$ = new Subject<void>();
  #ngZone = inject(NgZone);
  authStore = inject(AuthStore);
  date = new Date();
  icons = { calendar: Calendar };

  constructor() {
    afterNextRender(() => {
      this.#ngZone.runOutsideAngular(() => {
        this.setupEventListeners();
      });
    });
  }

  handleSignOut(): void {
    this.authStore.signOut();
  }

  closeNav(): void {
    this.mobileNav()?.closeNav();
  }

  setupEventListeners(): void {
    const click$ = fromEvent(document, 'click');
    const scroll$ = fromEvent(window, 'scroll');
    click$.pipe(takeUntil(this.#destroy$)).subscribe((event: Event) => {
      const isInside = this.#elementRef.nativeElement.contains(event.target);
      const isMenuOpen = this.mobileNav()?.isOpen();
      if (isMenuOpen && !isInside) this.closeNav();
    });
    scroll$.pipe(takeUntil(this.#destroy$)).subscribe(() => {
      const shouldFix = window.scrollY > 20;
      if (this.isFixed() !== shouldFix) this.isFixed.set(shouldFix);
      if (this.mobileNav()?.isOpen()) this.closeNav();
    });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
