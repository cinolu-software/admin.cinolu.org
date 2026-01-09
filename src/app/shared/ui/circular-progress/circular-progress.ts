import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-circular-progress',
  imports: [CommonModule],
  templateUrl: './circular-progress.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircularProgressComponent {
  percentage = input.required<number>();
  size = input<number>(80);
  strokeWidth = input<number>(6);
  center = computed(() => this.size() / 2);
  radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  offset = computed(() => {
    const perc = this.percentage();
    return this.circumference() - (this.circumference() * perc) / 100;
  });
  strokeColor = computed(() => {
    const perc = this.percentage();
    if (perc < 50) return 'text-primary-400';
    if (perc < 80) return 'text-primary-500';
    return 'text-primary-600';
  });

  textColor = computed(() => {
    const perc = this.percentage();
    if (perc < 50) return 'text-primary-600';
    if (perc < 80) return 'text-primary-700';
    return 'text-primary-800';
  });
}
