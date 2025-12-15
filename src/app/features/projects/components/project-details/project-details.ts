import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
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

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.html',
  imports: [UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent, LucideAngularModule, CommonModule]
})
export class ProjectDetailsComponent {
  project = input.required<IProject>();
  icons = { FolderOpen, User, Clock, Calendar, Flag, FileText, BookOpen, Target, SquareCheckBig };
}
