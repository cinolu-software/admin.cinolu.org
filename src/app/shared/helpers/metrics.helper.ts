import { IIndicator, IMetric } from '@shared/models';

export interface MetricValues {
  target: number | null;
  achieved: number | null;
}

export type MetricsMap = Record<string, MetricValues>;

export interface MetricDto {
  indicatorId: string;
  target: number;
  achieved: number;
}

export type PerformanceStatus = 'low' | 'medium' | 'high';

export interface PerformanceThresholds {
  medium: number;
  high: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  medium: 50,
  high: 80
};

export function metricsMap(indicators: IIndicator[], existingMetrics: IMetric[] = []): MetricsMap {
  return indicators.reduce((acc, indicator) => {
    const metric = existingMetrics.find((m) => m?.indicator?.id === indicator.id);
    acc[indicator.id] = {
      target: metric?.target ?? null,
      achieved: metric?.achieved ?? null
    };
    return acc;
  }, {} as MetricsMap);
}

export function metricsMapToDto(metricsMap: MetricsMap, indicators: IIndicator[]): MetricDto[] {
  return indicators.map((indicator) => ({
    indicatorId: indicator.id,
    target: metricsMap[indicator.id]?.target ?? 0,
    achieved: metricsMap[indicator.id]?.achieved ?? 0
  }));
}

export function totalMetrics(metricsMap: MetricsMap, field: 'target' | 'achieved'): number {
  return Object.values(metricsMap).reduce((sum, metric) => sum + (metric[field] ?? 0), 0);
}

export function achievementRate(totalTargeted: number, totalAchieved: number): number {
  if (!totalTargeted || !totalAchieved) return 0;
  return Math.round((totalAchieved / totalTargeted) * 100);
}

export function performanceStatus(
  percentage: number,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): PerformanceStatus {
  if (percentage < thresholds.medium) return 'low';
  if (percentage < thresholds.high) return 'medium';
  return 'high';
}

export function performanceColor(status: PerformanceStatus): string {
  const colorMap: Record<PerformanceStatus, string> = {
    low: 'bg-red-500',
    medium: 'bg-yellow-500',
    high: 'bg-green-500'
  };
  return colorMap[status];
}

export function validateMetrics(metricsMap: MetricsMap): boolean {
  return Object.values(metricsMap).every(
    (metric) => metric.target !== null && metric.achieved !== null && metric.target >= 0 && metric.achieved >= 0
  );
}

export function metricsSummary(metricsMap: MetricsMap) {
  const totalTargeted = totalMetrics(metricsMap, 'target');
  const totalAchieved = totalMetrics(metricsMap, 'achieved');
  const percentage = achievementRate(totalTargeted, totalAchieved);
  const status = performanceStatus(percentage);
  return {
    totalTargeted,
    totalAchieved,
    percentage,
    status,
    color: performanceColor(status)
  };
}

export function calculateGroupMetrics(metricsMap: MetricsMap, indicators: IIndicator[]) {
  const totalTargeted = indicators.reduce((sum, ind) => sum + (metricsMap[ind.id]?.target ?? 0), 0);
  const totalAchieved = indicators.reduce((sum, ind) => sum + (metricsMap[ind.id]?.achieved ?? 0), 0);
  const percentage = achievementRate(totalTargeted, totalAchieved);
  const status = performanceStatus(percentage);
  return {
    totalTargeted,
    totalAchieved,
    percentage,
    status,
    color: performanceColor(status)
  };
}

export function groupIndicatorsByCategory(indicators: IIndicator[]) {
  const groups: Record<string, IIndicator[]> = {};
  indicators.forEach((indicator) => {
    const key = indicator.category ?? 'Autres';
    if (!groups[key]) groups[key] = [];
    groups[key].push(indicator);
  });
  return Object.keys(groups).map((key) => ({ category: key, indicators: groups[key] }));
}
