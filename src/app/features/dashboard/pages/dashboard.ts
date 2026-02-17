import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CalendarDays,
  ChartBar,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  LayoutList,
  LucideAngularModule,
  Rocket,
  Users,
  FolderOpen,
  Folder,
  FileCode,
  Calendar
} from 'lucide-angular';
import { UiSelect } from '@ui';
import type { SelectOption } from '@shared/ui';
import { StatsStore } from '../store/stats.store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  imports: [RouterModule, FormsModule, LucideAngularModule, UiSelect],
  providers: [StatsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  store = inject(StatsStore);
  currentYear = new Date().getFullYear();
  selectedYear = signal(this.currentYear);
  icons = {
    Users,
    FolderKanban,
    CalendarDays,
    Rocket,
    ChartBar,
    LayoutList,
    ChevronRight,
    ChevronDown,
    FolderOpen,
    Folder,
    FileCode,
    Calendar
  };

  expandedPrograms = signal<Set<string>>(new Set());
  expandedSubprograms = signal<Set<string>>(new Set());

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

  toggleProgram(programId: string): void {
    const expanded = new Set(this.expandedPrograms());
    if (expanded.has(programId)) {
      expanded.delete(programId);
    } else {
      expanded.add(programId);
    }
    this.expandedPrograms.set(expanded);
  }

  toggleSubprogram(subprogramId: string): void {
    const expanded = new Set(this.expandedSubprograms());
    if (expanded.has(subprogramId)) {
      expanded.delete(subprogramId);
    } else {
      expanded.add(subprogramId);
    }
    this.expandedSubprograms.set(expanded);
  }

  isProgramExpanded(programId: string): boolean {
    return this.expandedPrograms().has(programId);
  }

  isSubprogramExpanded(subprogramId: string): boolean {
    return this.expandedSubprograms().has(subprogramId);
  }
}
