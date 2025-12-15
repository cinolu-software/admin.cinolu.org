import { Component, input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-accordion',
  imports: [CommonModule],
  template: `<div class="space-y-2"><ng-content /></div>`
})
export class UiAccordion {
  multiple = input<boolean>(false);
  activeValues = signal<Set<string>>(new Set());

  toggle(value: string): void {
    const values = new Set(this.activeValues());

    if (values.has(value)) {
      values.delete(value);
    } else {
      if (!this.multiple()) {
        values.clear();
      }
      values.add(value);
    }

    this.activeValues.set(values);
  }

  isActive(value: string): boolean {
    return this.activeValues().has(value);
  }
}

@Component({
  selector: 'ui-accordion-panel',
  imports: [CommonModule],
  template: `
    <div class="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <ng-content />
    </div>
  `
})
export class UiAccordionPanel {
  value = input.required<string>();
  private accordion = inject(UiAccordion, { optional: true });

  isActive = computed(() => {
    return this.accordion?.isActive(this.value()) ?? false;
  });

  toggle(): void {
    this.accordion?.toggle(this.value());
  }
}

@Component({
  selector: 'ui-accordion-header',
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

@Component({
  selector: 'ui-accordion-content',
  imports: [CommonModule],
  template: `
    @if (panel?.isActive()) {
    <div class=" px-6 pt-3 pb-6">
      <ng-content />
    </div>
    }
  `
})
export class UiAccordionContent {
  panel = inject(UiAccordionPanel, { optional: true });
}
