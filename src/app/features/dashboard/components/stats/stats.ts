import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StatsStore } from '../../store/stats.store';
import {
  LucideAngularModule,
  Users,
  FileText,
  Calendar,
  BookOpen,
  MessageSquare,
  Award,
  Clock,
  CircleX,
  Building2,
  Briefcase,
  FolderKanban,
  Layers,
  SearchX
} from 'lucide-angular';
import { UiDatepicker } from '@shared/ui';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  providers: [StatsStore],
  imports: [RouterModule, FormsModule, LucideAngularModule, UiDatepicker]
})
export class Stats {
  adminStatsStore = inject(StatsStore);
  year = signal<Date>(new Date());
  icons = {
    Calendar,
    Users,
    FileText,
    MessageSquare,
    Award,
    Clock,
    CircleX,
    SearchX
  };
  stats = computed(() => this.adminStatsStore.stats() ?? null);
  contentData = computed(() => {
    const stats = this.stats();
    if (!stats) return [];
    const { content } = stats;
    return [
      {
        label: 'Entreprises',
        total: content.ventures.total,
        published: content.ventures.published,
        unpublished: content.ventures.unpublished,
        color: 'primary',
        icon: Building2
      },
      {
        label: 'Projets',
        total: content.projects.total,
        published: content.projects.published,
        unpublished: content.projects.unpublished,
        color: 'secondary',
        icon: Briefcase
      },
      {
        label: 'Événements',
        total: content.events.total,
        published: content.events.published,
        unpublished: content.events.unpublished,
        color: 'amber',
        icon: Calendar
      },
      {
        label: 'Programmes',
        total: content.programs.total,
        published: content.programs.published,
        unpublished: content.programs.unpublished,
        color: 'emerald',
        icon: FolderKanban
      },
      {
        label: 'Sous-programmes',
        total: content.subprograms.total,
        published: content.subprograms.published,
        unpublished: content.subprograms.unpublished,
        color: 'blue',
        icon: Layers
      },
      {
        label: 'Articles',
        total: content.articles.total,
        published: content.articles.published,
        unpublished: content.articles.unpublished,
        color: 'purple',
        icon: BookOpen
      }
    ];
  });

  totalContent = computed(() => {
    const stats = this.stats();
    if (!stats) return 0;
    return (
      stats.content.ventures.total +
      stats.content.projects.total +
      stats.content.events.total +
      stats.content.programs.total +
      stats.content.subprograms.total +
      stats.content.articles.total
    );
  });

  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }
}
