import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule, FolderKanban, LayoutList, FileCode, Calendar } from 'lucide-angular';
import { UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent } from '@shared/ui/accordion';
import type { IProgramParticipations } from '../../types';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.html',
  imports: [LucideAngularModule, UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramDetails {
  program = input<IProgramParticipations | null>(null);
  icons = {
    FolderKanban,
    LayoutList,
    FileCode,
    Calendar
  };
}
