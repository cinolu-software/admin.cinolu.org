import { Component, input } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { LucideAngularModule, User, Phone, FileText, MapPin, Calendar } from 'lucide-angular';
import { IUser } from '@shared/models';
import { ApiImgPipe } from '@shared/pipes';

@Component({
  selector: 'app-account-overview',
  templateUrl: './account-overview.html',
  imports: [DatePipe, LucideAngularModule, NgOptimizedImage, ApiImgPipe]
})
export class AccountOverview {
  user = input.required<IUser>();
  icons = { User, Phone, FileText, MapPin, Calendar };

  genderLabel(user: IUser): string {
    switch (user.gender) {
      case 'male':
        return 'Masculin';
      case 'female':
        return 'Féminin';
      default:
        return 'Non spécifié';
    }
  }
}
