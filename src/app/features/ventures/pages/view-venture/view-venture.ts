import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VenturesStore } from '../../store/ventures.store';
import {
  LucideAngularModule,
  ToggleLeft,
  ToggleRight,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Images as ImageIcon,
  Package
} from 'lucide-angular';
import { UiBadge, UiConfirmDialog } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { DatePipe } from '@angular/common';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar } from '@shared/ui';

@Component({
  selector: 'app-view-venture',
  templateUrl: './view-venture.html',
  providers: [VenturesStore, ConfirmationService],
  imports: [LucideAngularModule, UiBadge, UiConfirmDialog, DatePipe, ApiImgPipe, UiAvatar]
})
export class ViewVenture implements OnInit {
  #route = inject(ActivatedRoute);
  #confirmationService = inject(ConfirmationService);
  #slug = this.#route.snapshot.params['slug'];
  store = inject(VenturesStore);
  icons = {
    ToggleLeft,
    ToggleRight,
    Building2,
    Globe,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ExternalLink,
    ImageIcon,
    Package
  };

  ngOnInit(): void {
    this.store.loadOne(this.#slug);
  }

  onTogglePublish(): void {
    const venture = this.store.venture();
    if (!venture) return;
    const action = venture.is_published ? 'dépublier' : 'publier';
    this.#confirmationService.confirm({
      header: `Confirmer la ${action}`,
      message: `Êtes-vous sûr de vouloir ${action} "${venture.name}" ?`,
      acceptLabel: action === 'publier' ? 'Publier' : 'Dépublier',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.togglePublish(venture.slug);
      }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  }
}
