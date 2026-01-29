import { Component, input } from '@angular/core';
import { LucideAngularModule, FolderKanban, TrendingUp, Award } from 'lucide-angular';

@Component({
  selector: 'app-performance',
  imports: [LucideAngularModule],
  templateUrl: './performance.html'
})
export class Performance {
  year = input.required<number>();
  programCount = input.required<number>();
  averagePerformance = input.required<number>();
  icons = { FolderKanban, TrendingUp, Award };
}
