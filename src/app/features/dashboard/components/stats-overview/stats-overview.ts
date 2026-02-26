import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule, Users, FolderKanban, CalendarDays, Rocket } from 'lucide-angular';
import type { IGeneralStats } from '../../types';

@Component({
  selector: 'app-stats-overview',
  templateUrl: './stats-overview.html',
  imports: [LucideAngularModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsOverview {
  data = input<IGeneralStats | null>(null);
  isLoading = input<boolean>(false);

  icons = {
    Users,
    FolderKanban,
    CalendarDays,
    Rocket
  };
}
