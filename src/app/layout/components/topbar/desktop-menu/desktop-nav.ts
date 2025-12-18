import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LogOut, ChevronDown } from 'lucide-angular';
import { IUser } from '@shared/models';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar } from '@ui';

@Component({
  selector: 'app-desktop-nav',
  templateUrl: './desktop-nav.html',
  imports: [RouterModule, ApiImgPipe, LucideAngularModule, UiAvatar]
})
export class DesktopNav {
  user = input.required<IUser | null>();
  signOut = output<void>();
  icons = { ChevronDown, LogOut };

  handleSignOut(): void {
    this.signOut.emit();
  }
}
