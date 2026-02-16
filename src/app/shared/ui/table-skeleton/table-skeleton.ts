import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ui-table-skeleton',
  templateUrl: './table-skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiTableSkeleton {
  columns = input<number>(10);
  rows = input<number>(10);

  columnsArray = computed(() => Array.from({ length: this.columns() }, (_, index) => index));
  rowsArray = computed(() => Array.from({ length: this.rows() }, (_, index) => index));
}
