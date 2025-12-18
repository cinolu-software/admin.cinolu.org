import { Component, inject } from '@angular/core';
import { UiAccordionPanel } from '../accordion-panel/accordion-panel';

@Component({
  selector: 'app-ui-accordion-content',
  templateUrl: './accordion-content.html'
})
export class UiAccordionContent {
  panel = inject(UiAccordionPanel, { optional: true });
}
