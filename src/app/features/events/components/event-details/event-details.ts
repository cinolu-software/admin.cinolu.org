import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
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
  User
} from 'lucide-angular';
import { UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent } from '@shared/ui';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.html',
  imports: [UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent, LucideAngularModule, CommonModule]
})
export class EventDetailsComponent {
  event = input.required<IEvent>();
  icons = {
    folder: FolderOpen,
    user: User,
    clock: Clock,
    calendar: Calendar,
    flag: Flag,
    fileText: FileText,
    bookOpen: BookOpen,
    target: Target,
    checkSquare: SquareCheckBig,
    mapPin: MapPin
  };
}
