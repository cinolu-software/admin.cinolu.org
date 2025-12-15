import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SquarePen, Images, ChartColumn, ListTree } from 'lucide-angular';
import { UiTabs, MetricsTableComponent } from '@shared/ui';
import { totalMetrics, achievementRate, metricsMap, metricsMapToDto } from '@shared/helpers';
import { IProject } from '@shared/models';
import { IndicatorsStore } from '@features/programs/store/indicators.store';
import { GalleryStore } from '../../store/project-gallery.store';
import { ProjectsStore } from '../../store/projects.store';
import { ProjectMetricsStore } from '../../store/project-metrics.store';
import { ProjectDetailsComponent } from '../../components/project-details/project-details';
import { ProjectGalleryComponent } from '../../components/project-gallery/project-gallery';
import { ProjectEditFormComponent } from '../../components/project-edit-form/project-edit-form';
import { ProjectDetailsSkeletonComponent } from '../../ui/project-details-skeleton/project-details-skeleton';
import { ProjectPhasesComponent } from '../../components/project-phases/project-phases';

@Component({
  selector: 'app-project-update',
  templateUrl: './update-project.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IndicatorsStore, GalleryStore, ProjectsStore, ProjectMetricsStore],
  imports: [
    CommonModule,
    UiTabs,
    MetricsTableComponent,
    ProjectDetailsComponent,
    ProjectGalleryComponent,
    ProjectEditFormComponent,
    ProjectDetailsSkeletonComponent,
    ProjectPhasesComponent
  ]
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
    { label: 'Indicateurs', name: 'indicators', icon: ChartColumn },
    { label: 'Phases & Ressources', name: 'phases', icon: ListTree }
  ];
  totalTargeted = computed(() => totalMetrics(this.metricsMap, 'target'));
  totalAchieved = computed(() => totalMetrics(this.metricsMap, 'achieved'));
  achievementPercentage = computed(() => achievementRate(this.totalTargeted(), this.totalAchieved()));

  constructor() {
    this.#watchProjectChanges();
  }

  ngOnInit(): void {
    this.projectStore.loadProject(this.#slug);
    this.galleryStore.loadGallery(this.#slug);
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
    this.metricsStore.addMetrics({ id: project.id, metrics });
  }

  onCoverUploaded(): void {
    this.projectStore.loadProject(this.#slug);
  }

  onGalleryUploaded(): void {
    this.galleryStore.loadGallery(this.#slug);
  }

  onDeleteImage(id: string): void {
    this.galleryStore.deleteImage(id);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }
}
