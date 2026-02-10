import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CalendarDays, ChartBar, FolderKanban, LayoutList, LucideAngularModule, Rocket, Users } from 'lucide-angular';
import { UiBadge } from '@shared/ui/badge/badge';
import { UiSelect } from '@ui';
import type { SelectOption } from '@shared/ui';
import { StatsStore } from '../store/stats.store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  imports: [RouterModule, FormsModule, LucideAngularModule, UiBadge, UiSelect],
  providers: [StatsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  store = inject(StatsStore);
  currentYear = new Date().getFullYear();
  selectedYear = signal(this.currentYear);
  icons = { Users, FolderKanban, CalendarDays, Rocket, ChartBar, LayoutList };

  constructor() {
    effect(() => {
      this.store.loadByYear(this.selectedYear());
    });
  }

  ngOnInit(): void {
    this.store.loadGeneral();
  }

  yearSelectOptions = computed<SelectOption[]>(() =>
    [2024, 2025, 2026, 2027].map((y) => ({ label: String(y), value: y }))
  );
}
