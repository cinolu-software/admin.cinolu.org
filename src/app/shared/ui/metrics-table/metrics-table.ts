import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChartColumn, ChevronDown, Lock, AlertTriangle } from 'lucide-angular';
import { MetricsMap, groupIndicatorsByCategory, calculateGroupMetrics } from '../../helpers';
import { IIndicator, IMetric } from '../../models';
import { CircularProgressComponent } from '../circular-progress/circular-progress';
import { UiButton } from '../form/button/button';

@Component({
  selector: 'ui-metrics-table',
  imports: [FormsModule, LucideAngularModule, CircularProgressComponent, UiButton],
  templateUrl: './metrics-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsTableComponent {
  indicators = input.required<IIndicator[]>();
  metricsMap = input.required<MetricsMap>();
  existingMetrics = input<IMetric[]>([]);
  isLoading = input.required<boolean>();
  saveKPIs = output<void>();
  saveReports = output<void>();
  saveAll = output<void>();
  icons = {
    barChart: ChartColumn,
    lock: Lock,
    alertTriangle: AlertTriangle
  };

  iconsChevron = {
    chevron: ChevronDown
  };
  #metricsVersion = signal(0);
  totalIndicators = computed(() => this.indicators().length);
  groupedIndicators = computed(() => {
    const inds = this.indicators() ?? [];
    return groupIndicatorsByCategory(inds);
  });
  groupedWithSummary = computed(() => {
    this.#metricsVersion();
    const map = this.metricsMap();
    return this.groupedIndicators().map((g) => ({
      ...g,
      summary: calculateGroupMetrics(map, g.indicators)
    }));
  });

  totalTarget = computed(() => {
    this.#metricsVersion();
    return this.indicators().reduce((sum, indicator) => {
      const target = this.metricsMap()[indicator.id]?.target ?? 0;
      return sum + target;
    }, 0);
  });

  totalAchieved = computed(() => {
    this.#metricsVersion();
    return this.indicators().reduce((sum, indicator) => {
      const achieved = this.metricsMap()[indicator.id]?.achieved ?? 0;
      return sum + achieved;
    }, 0);
  });

  overallPerformance = computed(() => {
    const target = this.totalTarget();
    if (target === 0) return 0;
    const achieved = this.totalAchieved();
    return Math.round((achieved / target) * 100);
  });

  #existingTargets = computed(() => {
    return new Set(
      this.existingMetrics()
        .filter((m) => m.indicator && m.target && m.target > 0)
        .map((m) => m.indicator.id)
    );
  });

  hasExistingTarget(indicatorId: string): boolean {
    return this.#existingTargets().has(indicatorId);
  }

  // Check if an indicator has its own predefined target
  hasIndicatorTarget(indicatorId: string): boolean {
    const indicator = this.indicators().find((i) => i.id === indicatorId);
    return !!indicator?.target && indicator.target > 0;
  }

  // Get the indicator's predefined target limit
  getIndicatorTargetLimit(indicatorId: string): number | null {
    const indicator = this.indicators().find((i) => i.id === indicatorId);
    return indicator?.target ?? null;
  }

  // Calculate impact percentage (how much of the indicator's global target this project contributes)
  calculateImpactPercentage(indicatorId: string): number {
    const indicatorLimit = this.getIndicatorTargetLimit(indicatorId);
    if (!indicatorLimit || indicatorLimit === 0) return 0;

    const projectAchieved = this.metricsMap()[indicatorId]?.achieved ?? 0;
    return Math.round((projectAchieved / indicatorLimit) * 100);
  }

  hasUnsavedKPIs(): boolean {
    return this.indicators().some((indicator) => {
      const hasTarget = !!this.metricsMap()[indicator.id]?.target;
      const isExisting = this.hasExistingTarget(indicator.id);
      return hasTarget && !isExisting;
    });
  }

  calculatePercentage(indicatorId: string): number {
    const metric = this.metricsMap()[indicatorId];
    if (!metric || !metric.target || metric.target === 0) {
      return 0;
    }
    const achieved = metric.achieved ?? 0;
    return Math.round((achieved / metric.target) * 100);
  }

  onMetricChange(): void {
    this.#metricsVersion.update((v) => v + 1);
  }

  onTargetChange(indicatorId: string): void {
    const limit = this.getIndicatorTargetLimit(indicatorId);
    const currentTarget = this.metricsMap()[indicatorId]?.target;
    if (limit && currentTarget && currentTarget > limit) {
      this.metricsMap()[indicatorId].target = limit;
    }
    this.onMetricChange();
  }

  onSaveKPIs(): void {
    this.saveKPIs.emit();
  }

  onSaveReports(): void {
    this.saveReports.emit();
  }

  onSaveAll(): void {
    this.saveAll.emit();
  }
}
