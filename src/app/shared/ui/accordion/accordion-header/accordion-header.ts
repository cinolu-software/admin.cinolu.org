import { Component, inject } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { UiAccordionPanel } from '../accordion-panel/accordion-panel';

@Component({
  selector: 'app-ui-accordion-header',
  imports: [LucideAngularModule],
  template: `
    <button
      type="button"
      [class.bg-gray-100]="panel?.isActive()"
      class="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
      (click)="panel?.toggle()">
      <ng-content />
      <i-lucide
        [img]="icons.ChevronDown"
        class="size-5 transition-transform shrink-0"
        [class.rotate-180]="panel?.isActive()" />
    </button>
  `
})
export class UiAccordionHeader {
  panel = inject(UiAccordionPanel, { optional: true });
  icons = { ChevronDown };
}
