import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import {
  CalendarDays,
  ChartBar,
  ChevronDown,
  FolderKanban,
  LayoutList,
  LucideAngularModule,
  Rocket,
  Users
} from 'lucide-angular';
import { StatsStore } from '../../store/stats.store';
import { UiBadge } from '@shared/ui/badge/badge';
import { UiSelect } from '@ui';
import type { SelectOption } from '@shared/ui';

const currentYear = new Date().getFullYear();

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  imports: [RouterModule, ReactiveFormsModule, LucideAngularModule, UiBadge, UiSelect],
  providers: [StatsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Stats implements OnInit {
  store = inject(StatsStore);
  selectedYear = signal(currentYear);

  readonly yearControl = new FormControl<number>(currentYear, { nonNullable: true });
  private readonly yearValue = toSignal(
    this.yearControl.valueChanges.pipe(startWith(this.yearControl.value))
  );

  constructor() {
    effect(() => {
      this.store.loadByYear(this.selectedYear());
    });
    effect(() => {
      const v = this.yearValue();
      if (v != null) this.selectedYear.set(v);
    });
  }

  ngOnInit(): void {
    this.store.loadGeneral();
  }

  readonly icons = { Users, FolderKanban, CalendarDays, Rocket, ChevronDown, ChartBar, LayoutList };
  readonly yearOptions = computed(() => {
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  });
  readonly yearSelectOptions = computed<SelectOption[]>(() =>
    this.yearOptions().map((y) => ({ label: String(y), value: y }))
  );
}
