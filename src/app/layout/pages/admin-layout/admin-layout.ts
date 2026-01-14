import { Component, ChangeDetectionStrategy, HostListener, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { BackButton } from '@shared/ui/back-button/back-button';
import { UiAvatar } from '@ui';
import { AuthStore } from '@core/auth';
import { ChevronDown, LogOut, User, LucideAngularModule } from 'lucide-angular';
import { ApiImgPipe } from '../../../shared/pipes/api-img.pipe';
import { MobileMenu } from '../../components/mobile-menu/mobile-menu';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.html',
  imports: [
    RouterModule,
    LucideAngularModule,
    Sidebar,
    BackButton,
    UiAvatar,
    ApiImgPipe,
    MobileMenu
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayout {
  authStore = inject(AuthStore);
  icons = { ChevronDown, LogOut, User };
  isUserMenuOpen = signal(false);

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((value) => !value);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isInsideMenu = target.closest('[data-user-menu]');
    const isInsideButton = target.closest('[data-user-menu-button]');
    if (!isInsideMenu && !isInsideButton && this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
  }

  handleSignOut(): void {
    this.authStore.signOut();
  }
}
