import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule, Folder } from 'lucide-angular';
import type { IProgramParticipations } from '../../types';

@Component({
  selector: 'app-program-tabs',
  templateUrl: './program-tabs.html',
  imports: [LucideAngularModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramTabs {
  programs = input.required<IProgramParticipations[]>();
  selectedProgramId = input<string | null>(null);
  programSelected = output<string>();

  icons = {
    Folder
  };

  onSelectProgram(programId: string): void {
    this.programSelected.emit(programId);
  }
}
