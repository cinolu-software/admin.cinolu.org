import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IEvent } from '@shared/models';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Flag,
  FolderOpen,
  LucideAngularModule,
  MapPin,
  SquareCheckBig,
  Target,
  User,
  CircleCheckBig
} from 'lucide-angular';
import { UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent } from '@shared/ui';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-event-sheet',
  templateUrl: './event-sheet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiAccordion, DatePipe, UiAccordionPanel, UiAccordionHeader, UiAccordionContent, LucideAngularModule]
})
export class EventSheet {
  event = input.required<IEvent>();
  icons = {
    FolderOpen,
    User,
    Clock,
    Calendar,
    Flag,
    FileText,
    BookOpen,
    Target,
    SquareCheckBig,
    MapPin,
    CircleCheckBig
  };
}
