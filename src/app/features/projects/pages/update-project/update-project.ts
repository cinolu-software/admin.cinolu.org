import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SquarePen, Images, ChartColumn, Star, Eye, LucideAngularModule } from 'lucide-angular';
import { UiTabs } from '@shared/ui';
import { totalMetrics, achievementRate, metricsMap, metricsMapToDto } from '@shared/helpers';
import { IProject } from '@shared/models';
import { IndicatorsStore } from '@features/programs/store/indicators.store';
import { GalleryStore } from '../../store/project-gallery.store';
import { ProjectsStore } from '../../store/projects.store';
import { ProjectMetricsStore } from '../../store/project-metrics.store';
import { ProjectDetails } from '../../components/project-details/project-details';
import { ProjectGallery } from '../../components/project-gallery/project-gallery';
import { ProjectUpdateForm } from '../../components/project-update-form/project-update-form';
import { ProjectDetailsSkeleton } from '../../ui/project-details-skeleton/project-details-skeleton';
import { UiMetricsTable } from '@shared/ui/metrics-table/metrics-table';

@Component({
  selector: 'app-project-update',
  templateUrl: './update-project.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IndicatorsStore, GalleryStore, ProjectsStore, ProjectMetricsStore],
  imports: [UiTabs, UiMetricsTable, ProjectDetails, ProjectGallery, ProjectUpdateForm, ProjectDetailsSkeleton, LucideAngularModule]
})
export class UpdateProject implements OnInit {
  #route = inject(ActivatedRoute);
  #slug = this.#route.snapshot.params['slug'];
  projectStore = inject(ProjectsStore);
  galleryStore = inject(GalleryStore);
  metricsStore = inject(ProjectMetricsStore);
  indicatorsStore = inject(IndicatorsStore);
  metricsMap = {};
  activeTab = signal('details');
  tabs = [
    { label: "Fiche d'activité", name: 'details', icon: ChartColumn },
    { label: 'Mettre à jour', name: 'edit', icon: SquarePen },
    { label: 'Galerie', name: 'gallery', icon: Images },
    { label: 'Indicateurs', name: 'indicators', icon: ChartColumn }
  ];
  totalTargeted = computed(() => totalMetrics(this.metricsMap, 'target'));
  totalAchieved = computed(() => totalMetrics(this.metricsMap, 'achieved'));
  achievementPercentage = computed(() => achievementRate(this.totalTargeted(), this.totalAchieved()));

  constructor() {
    this.#watchProjectChanges();
  }

  ngOnInit(): void {
    this.projectStore.loadOne(this.#slug);
    this.galleryStore.loadAll(this.#slug);
  }

  #watchProjectChanges(): void {
    effect(() => {
      const project = this.projectStore.project();
      if (!project) return;
      this.#initMetrics(project);
    });
  }

  #initMetrics(project: IProject): void {
    const indicators = this.indicatorsStore.indicators();
    this.metricsMap = metricsMap(indicators, project.metrics);
  }

  onSaveMetrics(): void {
    const project = this.projectStore.project();
    if (!project) return;
    const indicators = this.indicatorsStore.indicators();
    const metrics = metricsMapToDto(this.metricsMap, indicators);
    this.metricsStore.create({ id: project.id, metrics });
  }

  onCoverUploaded(): void {
    this.projectStore.loadOne(this.#slug);
  }

  onGalleryUploaded(): void {
    this.galleryStore.loadAll(this.#slug);
  }

  onDeleteImage(id: string): void {
    this.galleryStore.delete(id);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onShowcase(): void {
    const project = this.projectStore.project();
    if (!project) return;
    this.projectStore.showcase(project.id);
  }

  onPublish(): void {
    const project = this.projectStore.project();
    if (!project) return;
    this.projectStore.publish(project.id);
  }

  icons = { Star, Eye };
}
