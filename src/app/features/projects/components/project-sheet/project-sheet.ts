import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IProject } from '@shared/models';
import {
  BookOpen,
  Calendar,
  SquareCheckBig,
  Clock,
  FileText,
  Flag,
  FolderOpen,
  LucideAngularModule,
  Target,
  User
} from 'lucide-angular';
import { UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent } from '@shared/ui';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-sheet',
  templateUrl: './project-sheet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiAccordion, DatePipe, UiAccordionPanel, UiAccordionHeader, UiAccordionContent, LucideAngularModule]
})
export class ProjectSheet {
  project = input.required<IProject>();
  icons = { FolderOpen, User, Clock, Calendar, Flag, FileText, BookOpen, Target, SquareCheckBig };
}
