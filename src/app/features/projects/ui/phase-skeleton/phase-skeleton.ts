import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './phase-skeleton.html',
  selector: 'app-phase-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhaseSkeleton {}
