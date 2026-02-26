import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IStatsSummary } from '@features/dashboard/types';
import { LucideAngularModule, ChartBar, FolderKanban, CalendarDays } from 'lucide-angular';

@Component({
  selector: 'app-year-summary',
  templateUrl: './year-summary.html',
  imports: [LucideAngularModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YearSummary {
  summary = input.required<IStatsSummary>();
  icons = {
    ChartBar,
    FolderKanban,
    CalendarDays
  };
}
