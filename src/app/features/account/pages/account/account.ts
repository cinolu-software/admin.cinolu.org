import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, Phone, FileText, SquarePen, Camera, Calendar, MapPin } from 'lucide-angular';
import { AuthStore } from '@core/auth';
import { environment } from '@env/environment';
import { UiTabs } from '@ui';
import { AccountOverview } from '@features/account/components/account-overview/account-overview';
import { AccountUpdate } from '@features/account/components/account-update/account-update';

@Component({
  selector: 'app-account-page',
  templateUrl: './account.html',
  imports: [CommonModule, LucideAngularModule, UiTabs, AccountOverview, AccountUpdate]
})
export class AccountPage implements OnInit {
  store = inject(AuthStore);
  url = environment.apiUrl + 'users/image-profile';
  activeTab = signal<string>('overview');
  tabs = [
    { label: 'Mon compte', name: 'overview', icon: User },
    { label: 'Mettre à jour', name: 'update', icon: SquarePen }
  ];
  icons = {
    user: User,
    phone: Phone,
    fileText: FileText,
    edit: SquarePen,
    camera: Camera,
    calendar: Calendar,
    mapPin: MapPin
  };

  ngOnInit(): void {
    this.store.user();
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  handleLoaded(): void {
    this.store.getProfile();
  }
}
