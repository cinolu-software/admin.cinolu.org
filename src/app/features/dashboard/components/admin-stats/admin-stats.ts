import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminReportStore } from '../../store/admin-report.store';
import { AdminStatsStore } from '../../store/admin-stats.store';
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
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Building2,
  Briefcase,
  FolderKanban,
  Layers,
  Shield
} from 'lucide-angular';
import { PerformanceOverview } from '../performance-overview/performance-overview';
import { ProgramCard } from '../../ui/program-card/program-card';
import { PerformanceSkeleton } from '../../ui/performance-skeleton/performance-skeleton';
import { UiDatepicker } from '@shared/ui';

@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.html',
  providers: [AdminReportStore, AdminStatsStore],
  imports: [
    RouterModule,
    FormsModule,
    LucideAngularModule,
    PerformanceOverview,
    ProgramCard,
    PerformanceSkeleton,
    UiDatepicker
  ]
})
export class AdminStats {
  reportStore = inject(AdminReportStore);
  adminStatsStore = inject(AdminStatsStore);
  year = signal<Date>(new Date());
  icons = {
    Calendar,
    Users,
    FileText,
    BookOpen,
    MessageSquare,
    Award,
    Clock,
    CircleX,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    Building2,
    Briefcase,
    FolderKanban,
    Layers,
    Shield
  };

  constructor() {
    effect(() => {
      this.reportStore.getAdminReport(this.year().getFullYear());
    });
  }

  averagePerformance = computed(() => {
    const reports = this.reportStore.report();
    if (!reports || reports.length === 0) return 0;
    const totalPerformance = reports.reduce((sum, program) => {
      const programPerformance =
        program.categories.length > 0
          ? program.categories.reduce((catSum, cat) => catSum + (cat.performance || 0), 0) / program.categories.length
          : 0;
      return sum + programPerformance;
    }, 0);
    return Math.round(totalPerformance / reports.length);
  });

  sortedPrograms = computed(() => {
    const reports = this.reportStore.report();
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => {
      const perfA =
        a.categories.length > 0
          ? a.categories.reduce((sum, cat) => sum + (cat.performance || 0), 0) / a.categories.length
          : 0;
      const perfB =
        b.categories.length > 0
          ? b.categories.reduce((sum, cat) => sum + (cat.performance || 0), 0) / b.categories.length
          : 0;
      return perfB - perfA;
    });
  });

  stats = computed(() => this.adminStatsStore.stats() ?? null);
  showStats = computed(() => !this.adminStatsStore.isLoading() && this.stats() !== null);
  showError = computed(() => !this.adminStatsStore.isLoading() && this.stats() === null);

  userRolesData = computed(() => {
    const stats = this.stats();
    if (!stats) return [];
    const { byRole } = stats.users;
    return [
      { label: 'Utilisateurs', value: byRole.user, color: 'primary', icon: Users },
      { label: 'Mentors', value: byRole.mentor, color: 'secondary', icon: Award },
      { label: 'Personnel', value: byRole.staff, color: 'blue', icon: Briefcase },
      { label: 'Administrateurs', value: byRole.admin, color: 'purple', icon: Shield }
    ];
  });

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

  totalPublishedContent = computed(() => {
    const stats = this.stats();
    if (!stats) return 0;
    return (
      stats.content.ventures.published +
      stats.content.projects.published +
      stats.content.events.published +
      stats.content.programs.published +
      stats.content.subprograms.published +
      stats.content.articles.published
    );
  });

  round(value: number): number {
    return Math.round(value);
  }

  calculatePercentage(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  getUserRolePercentage(roleCount: number): number {
    const stats = this.stats();
    if (!stats || stats.users.total === 0) return 0;
    return this.calculatePercentage(roleCount, stats.users.total);
  }
}
