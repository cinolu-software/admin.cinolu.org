import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { UiAccordionPanel } from '../accordion-panel/accordion-panel';

@Component({
  selector: 'app-ui-accordion-header',
  imports: [LucideAngularModule],
  templateUrl: './accordion-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAccordionHeader {
  panel = inject(UiAccordionPanel, { optional: true });
  icons = { ChevronDown };
}
