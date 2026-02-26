import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { UiAccordionPanel } from '../accordion-panel/accordion-panel';

@Component({
  selector: 'app-ui-accordion-content',
  templateUrl: './accordion-content.html',
  styles: [`
    .accordion-content {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      transition: grid-template-rows 220ms ease, opacity 180ms ease;
    }

    .accordion-content.is-open {
      grid-template-rows: 1fr;
      opacity: 1;
    }

    .accordion-content__inner {
      overflow: hidden;
    }
  `],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAccordionContent {
  panel = inject(UiAccordionPanel, { optional: true });
}
