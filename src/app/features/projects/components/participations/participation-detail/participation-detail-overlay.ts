import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge } from '@shared/ui';
import type { ProjectParticipation } from '@shared/models';

@Component({
  selector: 'app-participation-detail-overlay',
  templateUrl: './participation-detail-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ApiImgPipe, UiAvatar, UiBadge]
})
export class ParticipationDetailOverlay {
  participation = input<ProjectParticipation | null>(null);
  closed = output<void>();

  readonly iconX = X;

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter') {
      this.emitClose();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  emitClose(): void {
    this.closed.emit();
  }
}
