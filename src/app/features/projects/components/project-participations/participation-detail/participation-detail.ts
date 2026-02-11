import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge } from '@shared/ui';
import type { IProjectParticipation } from '@shared/models';

@Component({
  selector: 'app-participation-detail',
  templateUrl: './participation-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApiImgPipe, UiAvatar, UiBadge]
})
export class ParticipationDetail {
  participation = input.required<IProjectParticipation>();
  participationId = input.required<string>();
}
