import { Component, input, ChangeDetectionStrategy } from '@angular/core';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';
type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-ui-badge',
  templateUrl: './badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiBadge {
  label = input.required<string>();
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('medium');

  variantClasses: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    warning: {
      container: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    danger: {
      container: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500'
    },
    info: {
      container: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500'
    },
    default: {
      container: 'bg-gray-100 text-gray-700 border-gray-300',
      dot: 'bg-gray-400'
    }
  };

  protected sizeClasses: Record<BadgeSize, { container: string; dot: string }> = {
    small: {
      container: 'px-2 py-0.5 text-xs gap-1',
      dot: 'w-1 h-1'
    },
    medium: {
      container: 'px-2.5 py-1 text-xs gap-1.5',
      dot: 'w-1.5 h-1.5'
    },
    large: {
      container: 'px-3 py-1.5 text-sm gap-2',
      dot: 'w-2 h-2'
    }
  };
}
